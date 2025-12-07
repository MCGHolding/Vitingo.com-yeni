"""
Package Features Router
=======================
Vitingo CRM - Paket Özellik Yönetimi

Bu modül TİCARİ kısıtlamalar içindir:
- Hangi paket hangi özellikleri içeriyor
- Tenant hangi pakette
- Özellik kontrolü (upgrade prompt için)

Feature Flags'tan FARKLI:
- Feature Flags = Geliştirme kontrolü
- Package Features = Ticari kısıtlama
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import os

router = APIRouter(prefix="/api/packages", tags=["Package Features"])

# Dependency to get database
async def get_db():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db_name = os.environ.get('DB_NAME', 'crm_db')
    db = client[db_name]
    return db


# ============================================================
# MODELS
# ============================================================

class PackageCreate(BaseModel):
    """Yeni paket tanımı"""
    key: str = Field(..., description="Benzersiz paket key'i (starter, professional, enterprise)")
    name: str = Field(..., description="Görünen ad")
    name_tr: str = Field(..., description="Türkçe ad")
    description: Optional[str] = None
    description_tr: Optional[str] = None
    
    # Fiyatlandırma
    price_monthly_usd: float = Field(..., description="Aylık fiyat (USD)")
    price_yearly_usd: float = Field(..., description="Yıllık fiyat (USD)")
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_yearly: Optional[str] = None
    
    # Limitler
    limits: Dict = Field(default_factory=dict, description="Paket limitleri")
    # Örnek: {"max_users": 5, "max_companies": 1, "max_projects": 50, "storage_gb": 5, "email_per_month": 500}
    
    # Özellikler
    features: List[str] = Field(default_factory=list, description="Dahil olan özellikler")
    # Örnek: ["customers", "projects", "invoices", "basic_reports"]
    
    # Meta
    is_active: bool = Field(True)
    is_popular: bool = Field(False, description="UI'da 'En Popüler' badge")
    sort_order: int = Field(100)
    badge_text: Optional[str] = Field(None, description="Özel badge (örn: 'En Çok Tercih Edilen')")


class PackageUpdate(BaseModel):
    """Paket güncelleme"""
    name: Optional[str] = None
    name_tr: Optional[str] = None
    description: Optional[str] = None
    description_tr: Optional[str] = None
    price_monthly_usd: Optional[float] = None
    price_yearly_usd: Optional[float] = None
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_yearly: Optional[str] = None
    limits: Optional[Dict] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_popular: Optional[bool] = None
    sort_order: Optional[int] = None
    badge_text: Optional[str] = None


class FeatureDefinition(BaseModel):
    """Özellik tanımı"""
    key: str = Field(..., description="Benzersiz özellik key'i")
    name: str
    name_tr: str
    description: Optional[str] = None
    description_tr: Optional[str] = None
    category: str = Field(..., description="crm, accounting, lead_gen, reports, integrations")
    is_active: bool = Field(True)


class FeatureCheckRequest(BaseModel):
    """Özellik kontrolü isteği"""
    tenant_slug: str
    feature_key: str


class FeatureCheckResponse(BaseModel):
    """Özellik kontrolü yanıtı"""
    feature_key: str
    has_access: bool
    reason: str  # included, not_in_package, limit_exceeded, trial_expired
    current_package: str
    upgrade_packages: List[str]  # Bu özelliği içeren paketler


# ============================================================
# DATABASE HELPERS
# ============================================================

async def get_platform_db():
    """Platform database bağlantısı"""
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    return client.vitingo_platform


# ============================================================
# PACKAGES ENDPOINTS
# ============================================================

@router.get("")
async def list_packages(active_only: bool = Query(True)):
    """
    Tüm paketleri listele
    
    Landing page ve pricing sayfası için kullanılır.
    """
    db = await get_platform_db()
    collection = db.packages
    
    query = {}
    if active_only:
        query["is_active"] = True
    
    packages = await collection.find(query).sort("sort_order", 1).to_list(20)
    
    for pkg in packages:
        pkg["id"] = str(pkg.pop("_id"))
    
    return packages


@router.get("/{package_key}")
async def get_package(package_key: str):
    """Tek paket detayı"""
    db = await get_platform_db()
    collection = db.packages
    
    package = await collection.find_one({"key": package_key})
    
    if not package:
        raise HTTPException(status_code=404, detail=f"Paket '{package_key}' bulunamadı")
    
    package["id"] = str(package.pop("_id"))
    return package


@router.post("")
async def create_package(package: PackageCreate):
    """Yeni paket oluştur (Ultra Admin)"""
    db = await get_platform_db()
    collection = db.packages
    
    existing = await collection.find_one({"key": package.key})
    if existing:
        raise HTTPException(status_code=400, detail=f"'{package.key}' key'i zaten mevcut")
    
    doc = {
        **package.dict(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    
    return doc


@router.put("/{package_key}")
async def update_package(package_key: str, update: PackageUpdate):
    """Paket güncelle (Ultra Admin)"""
    db = await get_platform_db()
    collection = db.packages
    
    existing = await collection.find_one({"key": package_key})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Paket '{package_key}' bulunamadı")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await collection.update_one(
        {"key": package_key},
        {"$set": update_data}
    )
    
    updated = await collection.find_one({"key": package_key})
    updated["id"] = str(updated.pop("_id"))
    
    return updated


# ============================================================
# FEATURES ENDPOINTS
# ============================================================

@router.get("/features/all")
async def list_all_features():
    """
    Tüm tanımlı özellikleri listele
    
    Admin panelinde paket düzenlerken kullanılır.
    """
    db = await get_platform_db()
    collection = db.package_features
    
    features = await collection.find({"is_active": True}).to_list(100)
    
    for feature in features:
        feature["id"] = str(feature.pop("_id"))
    
    return features


@router.post("/features")
async def create_feature(feature: FeatureDefinition):
    """Yeni özellik tanımla (Ultra Admin)"""
    db = await get_platform_db()
    collection = db.package_features
    
    existing = await collection.find_one({"key": feature.key})
    if existing:
        raise HTTPException(status_code=400, detail=f"'{feature.key}' key'i zaten mevcut")
    
    doc = {
        **feature.dict(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    
    return doc


# ============================================================
# FEATURE CHECK ENDPOINTS
# ============================================================

@router.post("/check-feature")
async def check_feature(request: FeatureCheckRequest):
    """
    Tenant'ın belirli bir özelliğe erişimi var mı kontrol et
    
    Frontend'den çağrılır.
    """
    db = await get_platform_db()
    
    # Tenant'ı bul
    tenant = await db.tenants.find_one({"slug": request.tenant_slug})
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant bulunamadı")
    
    # Tenant'ın paketi
    package_key = tenant.get("package_key", "starter")
    
    # Paketi bul
    package = await db.packages.find_one({"key": package_key})
    
    if not package:
        # Varsayılan starter paketi
        package = {"key": "starter", "features": []}
    
    # Özellik dahil mi?
    has_access = request.feature_key in package.get("features", [])
    
    # Feature override kontrolü (Ultra Admin özel açmış olabilir)
    feature_overrides = tenant.get("feature_overrides", {})
    if request.feature_key in feature_overrides:
        has_access = feature_overrides[request.feature_key]
    
    # Bu özelliği içeren paketleri bul (upgrade önerisi için)
    upgrade_packages = []
    if not has_access:
        all_packages = await db.packages.find({"is_active": True}).to_list(20)
        for pkg in all_packages:
            if request.feature_key in pkg.get("features", []):
                upgrade_packages.append(pkg["key"])
    
    return FeatureCheckResponse(
        feature_key=request.feature_key,
        has_access=has_access,
        reason="included" if has_access else "not_in_package",
        current_package=package_key,
        upgrade_packages=upgrade_packages
    )


@router.post("/check-limit")
async def check_limit(tenant_slug: str, limit_key: str, current_usage: int):
    """
    Tenant'ın belirli bir limite ulaşıp ulaşmadığını kontrol et
    
    Örnek: max_users, max_companies, max_projects
    """
    db = await get_platform_db()
    
    # Tenant'ı bul
    tenant = await db.tenants.find_one({"slug": tenant_slug})
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant bulunamadı")
    
    # Tenant'ın paketi
    package_key = tenant.get("package_key", "starter")
    
    # Paketi bul
    package = await db.packages.find_one({"key": package_key})
    
    if not package:
        raise HTTPException(status_code=404, detail="Paket bulunamadı")
    
    # Limit değeri
    limits = package.get("limits", {})
    max_value = limits.get(limit_key)
    
    if max_value is None:
        # Limit tanımlı değil = sınırsız
        return {
            "limit_key": limit_key,
            "max_value": None,
            "current_usage": current_usage,
            "is_exceeded": False,
            "remaining": None,
            "message": "Bu limit tanımlı değil (sınırsız)"
        }
    
    is_exceeded = current_usage >= max_value
    remaining = max(0, max_value - current_usage)
    
    return {
        "limit_key": limit_key,
        "max_value": max_value,
        "current_usage": current_usage,
        "is_exceeded": is_exceeded,
        "remaining": remaining,
        "message": f"Limit: {current_usage}/{max_value}" if not is_exceeded else "Limit aşıldı! Paketinizi yükseltin."
    }


@router.get("/tenant/{tenant_slug}/features")
async def get_tenant_features(tenant_slug: str):
    """
    Tenant'ın erişebildiği tüm özellikleri listele
    
    Frontend sayfa yüklenirken tüm özellikleri çekmek için.
    """
    db = await get_platform_db()
    
    # Tenant'ı bul
    tenant = await db.tenants.find_one({"slug": tenant_slug})
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant bulunamadı")
    
    # Tenant'ın paketi
    package_key = tenant.get("package_key", "starter")
    
    # Paketi bul
    package = await db.packages.find_one({"key": package_key})
    
    if not package:
        package = {"key": "starter", "features": [], "limits": {}}
    
    # Feature overrides
    feature_overrides = tenant.get("feature_overrides", {})
    
    # Tüm özellikleri birleştir
    all_features = set(package.get("features", []))
    
    # Override'ları uygula
    for feature_key, enabled in feature_overrides.items():
        if enabled:
            all_features.add(feature_key)
        elif feature_key in all_features:
            all_features.remove(feature_key)
    
    return {
        "tenant_slug": tenant_slug,
        "package_key": package_key,
        "package_name": package.get("name", "Starter"),
        "features": list(all_features),
        "limits": package.get("limits", {}),
        "feature_overrides": feature_overrides
    }


# ============================================================
# SEED DATA
# ============================================================

@router.post("/seed")
async def seed_packages():
    """
    Varsayılan paketleri ve özellikleri oluştur
    """
    db = await get_platform_db()
    
    # Önce özellikleri seed et
    features_result = await _seed_features(db)
    
    # Sonra paketleri seed et
    packages_result = await _seed_packages(db)
    
    return {
        "message": "Packages seed tamamlandı",
        "features": features_result,
        "packages": packages_result
    }


async def _seed_features(db):
    """Özellikleri seed et"""
    collection = db.package_features
    
    features = [
        # CRM
        {"key": "customers", "name": "Customer Management", "name_tr": "Müşteri Yönetimi", "category": "crm", "is_active": True},
        {"key": "customers_advanced", "name": "Advanced Customer Features", "name_tr": "Gelişmiş Müşteri Özellikleri", "category": "crm", "is_active": True},
        {"key": "projects", "name": "Project Management", "name_tr": "Proje Yönetimi", "category": "crm", "is_active": True},
        {"key": "opportunities", "name": "Sales Opportunities", "name_tr": "Satış Fırsatları", "category": "crm", "is_active": True},
        {"key": "fairs", "name": "Trade Fair Management", "name_tr": "Fuar Yönetimi", "category": "crm", "is_active": True},
        {"key": "calendar", "name": "Calendar & Meetings", "name_tr": "Takvim ve Toplantılar", "category": "crm", "is_active": True},
        {"key": "briefs", "name": "Brief Management", "name_tr": "Brief Yönetimi", "category": "crm", "is_active": True},
        {"key": "proposals", "name": "Proposal Management", "name_tr": "Teklif Yönetimi", "category": "crm", "is_active": True},
        {"key": "contracts", "name": "Contract Management", "name_tr": "Sözleşme Yönetimi", "category": "crm", "is_active": True},
        
        # Accounting
        {"key": "invoices", "name": "Invoice Management", "name_tr": "Fatura Yönetimi", "category": "accounting", "is_active": True},
        {"key": "current_accounts", "name": "Current Accounts", "name_tr": "Cari Hesaplar", "category": "accounting", "is_active": True},
        {"key": "collections", "name": "Collections", "name_tr": "Tahsilatlar", "category": "accounting", "is_active": True},
        {"key": "payments", "name": "Payments", "name_tr": "Ödemeler", "category": "accounting", "is_active": True},
        {"key": "expense_receipts", "name": "Expense Receipts", "name_tr": "Gider Makbuzları", "category": "accounting", "is_active": True},
        {"key": "advances", "name": "Advance Management", "name_tr": "Avans Yönetimi", "category": "accounting", "is_active": True},
        {"key": "bank_parsing", "name": "Bank Statement Parsing", "name_tr": "Banka Ekstre Analizi", "category": "accounting", "is_active": True},
        {"key": "multi_currency", "name": "Multi-Currency Support", "name_tr": "Çoklu Para Birimi", "category": "accounting", "is_active": True},
        
        # Organization
        {"key": "group_companies", "name": "Group Companies", "name_tr": "Grup Şirketleri", "category": "organization", "is_active": True},
        {"key": "departments", "name": "Department Management", "name_tr": "Departman Yönetimi", "category": "organization", "is_active": True},
        {"key": "position_hierarchy", "name": "Position Hierarchy", "name_tr": "Pozisyon Hiyerarşisi", "category": "organization", "is_active": True},
        {"key": "advanced_permissions", "name": "Advanced Permissions", "name_tr": "Gelişmiş Yetkiler", "category": "organization", "is_active": True},
        
        # Reports
        {"key": "basic_reports", "name": "Basic Reports", "name_tr": "Temel Raporlar", "category": "reports", "is_active": True},
        {"key": "advanced_reports", "name": "Advanced Reports", "name_tr": "Gelişmiş Raporlar", "category": "reports", "is_active": True},
        {"key": "custom_reports", "name": "Custom Reports", "name_tr": "Özel Raporlar", "category": "reports", "is_active": True},
        {"key": "export_reports", "name": "Export Reports", "name_tr": "Rapor Dışa Aktarma", "category": "reports", "is_active": True},
        
        # Lead Generation
        {"key": "lead_search", "name": "Lead Search", "name_tr": "Lead Arama", "category": "lead_gen", "is_active": True},
        {"key": "lead_reveal", "name": "Lead Email/Phone Reveal", "name_tr": "Lead İletişim Bilgisi", "category": "lead_gen", "is_active": True},
        {"key": "outbound_campaigns", "name": "Outbound Campaigns", "name_tr": "Dış Kampanyalar", "category": "lead_gen", "is_active": True},
        {"key": "email_sequences", "name": "Email Sequences", "name_tr": "E-posta Sekansları", "category": "lead_gen", "is_active": True},
        
        # Integrations
        {"key": "api_access", "name": "API Access", "name_tr": "API Erişimi", "category": "integrations", "is_active": True},
        {"key": "webhooks", "name": "Webhooks", "name_tr": "Webhook Entegrasyonu", "category": "integrations", "is_active": True},
        {"key": "custom_domain", "name": "Custom Email Domain", "name_tr": "Özel E-posta Domain", "category": "integrations", "is_active": True},
        
        # Support
        {"key": "email_support", "name": "Email Support", "name_tr": "E-posta Desteği", "category": "support", "is_active": True},
        {"key": "priority_support", "name": "Priority Support", "name_tr": "Öncelikli Destek", "category": "support", "is_active": True},
        {"key": "dedicated_support", "name": "Dedicated Support", "name_tr": "Özel Destek Temsilcisi", "category": "support", "is_active": True},
    ]
    
    created = 0
    for feature in features:
        existing = await collection.find_one({"key": feature["key"]})
        if not existing:
            feature["created_at"] = datetime.utcnow()
            feature["updated_at"] = datetime.utcnow()
            await collection.insert_one(feature)
            created += 1
    
    return {"created": created, "total": len(features)}


async def _seed_packages(db):
    """Paketleri seed et"""
    collection = db.packages
    
    packages = [
        {
            "key": "starter",
            "name": "Starter",
            "name_tr": "Başlangıç",
            "description": "Perfect for small teams getting started",
            "description_tr": "Küçük ekipler için ideal başlangıç paketi",
            "price_monthly_usd": 49,
            "price_yearly_usd": 490,
            "limits": {
                "max_users": 5,
                "max_companies": 1,
                "max_projects": 50,
                "storage_gb": 5,
                "email_per_month": 500
            },
            "features": [
                "customers", "projects", "opportunities", "fairs", "calendar",
                "invoices", "current_accounts", "collections", "payments",
                "basic_reports", "email_support"
            ],
            "is_active": True,
            "is_popular": False,
            "sort_order": 1
        },
        {
            "key": "professional",
            "name": "Professional",
            "name_tr": "Profesyonel",
            "description": "For growing businesses with advanced needs",
            "description_tr": "Büyüyen işletmeler için gelişmiş özellikler",
            "price_monthly_usd": 99,
            "price_yearly_usd": 990,
            "limits": {
                "max_users": 15,
                "max_companies": 3,
                "max_projects": 200,
                "storage_gb": 25,
                "email_per_month": 2000
            },
            "features": [
                "customers", "customers_advanced", "projects", "opportunities", "fairs", 
                "calendar", "briefs", "proposals", "contracts",
                "invoices", "current_accounts", "collections", "payments", 
                "expense_receipts", "advances", "bank_parsing", "multi_currency",
                "group_companies", "departments", "position_hierarchy",
                "basic_reports", "advanced_reports", "export_reports",
                "email_support", "priority_support"
            ],
            "is_active": True,
            "is_popular": True,
            "badge_text": "En Popüler",
            "sort_order": 2
        },
        {
            "key": "enterprise",
            "name": "Enterprise",
            "name_tr": "Kurumsal",
            "description": "Full-featured solution for large organizations",
            "description_tr": "Büyük organizasyonlar için tam özellikli çözüm",
            "price_monthly_usd": 199,
            "price_yearly_usd": 1990,
            "limits": {
                "max_users": 50,
                "max_companies": -1,  # Sınırsız
                "max_projects": -1,
                "storage_gb": 100,
                "email_per_month": 10000
            },
            "features": [
                "customers", "customers_advanced", "projects", "opportunities", "fairs", 
                "calendar", "briefs", "proposals", "contracts",
                "invoices", "current_accounts", "collections", "payments", 
                "expense_receipts", "advances", "bank_parsing", "multi_currency",
                "group_companies", "departments", "position_hierarchy", "advanced_permissions",
                "basic_reports", "advanced_reports", "custom_reports", "export_reports",
                "api_access", "webhooks", "custom_domain",
                "email_support", "priority_support", "dedicated_support"
            ],
            "is_active": True,
            "is_popular": False,
            "sort_order": 3
        }
    ]
    
    created = 0
    for package in packages:
        existing = await collection.find_one({"key": package["key"]})
        if not existing:
            package["created_at"] = datetime.utcnow()
            package["updated_at"] = datetime.utcnow()
            await collection.insert_one(package)
            created += 1
    
    return {"created": created, "total": len(packages)}
