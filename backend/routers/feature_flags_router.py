"""
Feature Flags Router
====================
Vitingo CRM - Feature Flag Yönetimi

Bu modül iki amaçla kullanılır:
1. Geliştirme kontrolü: Yeni modüllerin kademeli rollout'u
2. Demo erişimi: Geliştirme aşamasındaki modüllerin test edilmesi

Flag Durumları:
- disabled: Kimse göremez
- development: Sadece whitelist tenant'lar (demo)
- testing: Test aşamasında
- gradual: Kademeli rollout (%5, %25, %50, %100)
- enabled: Herkes görür
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import random
import os

router = APIRouter(prefix="/api/feature-flags", tags=["Feature Flags"])

# MongoDB connection - direkt bağlantı
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client['crm_db']

# Dependency to get database
async def get_db():
    return db


# ============================================================
# MODELS
# ============================================================

class FeatureFlagCreate(BaseModel):
    """Yeni feature flag oluşturma"""
    key: str = Field(..., description="Benzersiz flag key'i (örn: customer_module_v2)")
    name: str = Field(..., description="Görünen ad")
    description: Optional[str] = Field(None, description="Açıklama")
    module: Optional[str] = Field(None, description="İlgili modül (customers, invoices, vb.)")
    status: str = Field("disabled", description="disabled, development, testing, gradual, enabled")
    rollout_percentage: int = Field(0, ge=0, le=100, description="Gradual rollout yüzdesi")
    whitelist_tenants: List[str] = Field(default_factory=list, description="Her zaman açık olan tenant'lar")
    blacklist_tenants: List[str] = Field(default_factory=list, description="Her zaman kapalı olan tenant'lar")
    config: dict = Field(default_factory=dict, description="Flag'e özel konfigürasyon")


class FeatureFlagUpdate(BaseModel):
    """Feature flag güncelleme"""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    rollout_percentage: Optional[int] = Field(None, ge=0, le=100)
    whitelist_tenants: Optional[List[str]] = None
    blacklist_tenants: Optional[List[str]] = None
    config: Optional[dict] = None


class FeatureFlagCheck(BaseModel):
    """Flag kontrolü için istek"""
    tenant_slug: str
    user_role: Optional[str] = None


class FeatureFlagResponse(BaseModel):
    """Flag kontrolü yanıtı"""
    key: str
    enabled: bool
    reason: str  # whitelist, blacklist, rollout, status, disabled


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


async def get_feature_flags_collection():
    """Feature flags collection"""
    db = await get_platform_db()
    return db.feature_flags


# ============================================================
# ENDPOINTS
# ============================================================

@router.get("/list")
async def list_feature_flags(
    status: Optional[str] = None,
    module: Optional[str] = None,
    db = Depends(get_db)
):
    """
    Tüm feature flag'leri listele
    
    Query Params:
    - status: Duruma göre filtrele
    - module: Modüle göre filtrele
    """
    collection = db['feature_flags']
    
    query = {}
    if status:
        query["status"] = status
    if module:
        query["module"] = module
    
    flags = await collection.find(query).to_list(100)
    
    # ObjectId'leri string'e çevir
    for flag in flags:
        flag["id"] = str(flag.pop("_id"))
    
    return flags


@router.get("/{flag_key}")
async def get_feature_flag(flag_key: str):
    """Tek bir feature flag getir"""
    collection = db["feature_flags"]
    
    flag = await collection.find_one({"key": flag_key})
    
    if not flag:
        raise HTTPException(status_code=404, detail=f"Feature flag '{flag_key}' bulunamadı")
    
    flag["id"] = str(flag.pop("_id"))
    return flag


@router.post("")
async def create_feature_flag(flag: FeatureFlagCreate):
    """
    Yeni feature flag oluştur
    
    Sadece Ultra Admin kullanabilir.
    """
    collection = db["feature_flags"]
    
    # Key benzersizliği kontrolü
    existing = await collection.find_one({"key": flag.key})
    if existing:
        raise HTTPException(status_code=400, detail=f"'{flag.key}' key'i zaten mevcut")
    
    flag_doc = {
        **flag.dict(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": "ultra_admin",  # TODO: Auth'dan al
        "enabled_at": None,
        "disabled_at": None
    }
    
    result = await collection.insert_one(flag_doc)
    flag_doc["id"] = str(result.inserted_id)
    if "_id" in flag_doc:
        del flag_doc["_id"]
    
    return flag_doc


@router.put("/{flag_key}")
async def update_feature_flag(flag_key: str, update: FeatureFlagUpdate):
    """
    Feature flag güncelle
    
    Sadece Ultra Admin kullanabilir.
    """
    collection = db["feature_flags"]
    
    # Mevcut flag'i bul
    existing = await collection.find_one({"key": flag_key})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Feature flag '{flag_key}' bulunamadı")
    
    # Güncelleme verisi
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # Status değişikliklerini kaydet
    if "status" in update_data:
        if update_data["status"] == "enabled" and existing["status"] != "enabled":
            update_data["enabled_at"] = datetime.utcnow()
        elif update_data["status"] == "disabled" and existing["status"] != "disabled":
            update_data["disabled_at"] = datetime.utcnow()
    
    await collection.update_one(
        {"key": flag_key},
        {"$set": update_data}
    )
    
    # Güncellenmiş flag'i döndür
    updated = await collection.find_one({"key": flag_key})
    updated["id"] = str(updated.pop("_id"))
    
    return updated


@router.delete("/{flag_key}")
async def delete_feature_flag(flag_key: str):
    """
    Feature flag sil
    
    DİKKAT: Production'da aktif flag silinmemeli.
    Sadece Ultra Admin kullanabilir.
    """
    collection = db["feature_flags"]
    
    # Mevcut flag'i bul
    existing = await collection.find_one({"key": flag_key})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Feature flag '{flag_key}' bulunamadı")
    
    # Aktif flag silinemesin
    if existing["status"] in ["enabled", "gradual"]:
        raise HTTPException(
            status_code=400, 
            detail="Aktif veya gradual durumundaki flag silinemez. Önce disabled yapın."
        )
    
    await collection.delete_one({"key": flag_key})
    
    return {"message": f"Feature flag '{flag_key}' silindi"}


@router.post("/{flag_key}/check")
async def check_feature_flag(flag_key: str, check: FeatureFlagCheck, db = Depends(get_db)):
    """
    Belirli bir tenant için flag durumunu kontrol et
    
    Bu endpoint frontend'den çağrılır.
    
    Returns:
    - enabled: True/False
    - reason: Neden açık/kapalı olduğu
    """
    try:
        collection = db["feature_flags"]
        
        flag = await collection.find_one({"flag": flag_key})
        
        if not flag:
            return {
                "key": flag_key,
                "enabled": False,
                "reason": "not_found"
            }
    except Exception as e:
        print(f"Error finding flag: {str(e)}")
        return {
            "key": flag_key,
            "enabled": False,
            "reason": f"error: {str(e)}"
        }
    
    tenant_slug = check.tenant_slug
    
    # 1. Blacklist kontrolü (her zaman kapalı)
    if tenant_slug in flag.get("blacklist_tenants", []):
        return {
            "key": flag_key,
            "enabled": False,
            "reason": "blacklist"
        }
    
    # 2. Whitelist kontrolü (her zaman açık)
    if tenant_slug in flag.get("whitelist_tenants", []):
        return {
            "key": flag_key,
            "enabled": True,
            "reason": "whitelist"
        }
    
    # 3. Status kontrolü
    status = flag.get("status", "disabled")
    
    if status == "disabled":
        return {
            "key": flag_key,
            "enabled": False,
            "reason": "disabled"
        }
    
    if status == "development":
        # Sadece whitelist'tekiler görebilir (yukarıda kontrol edildi)
        return {
            "key": flag_key,
            "enabled": False,
            "reason": "development_only"
        }
    
    if status == "testing":
        # Test modunda - belirli roller görebilir
        if check.user_role in ["super-admin", "admin"]:
            return {
                "key": flag_key,
                "enabled": True,
                "reason": "testing_admin"
            }
        return {
            "key": flag_key,
            "enabled": False,
            "reason": "testing_restricted"
        }
    
    if status == "gradual":
        # Kademeli rollout - tenant bazlı deterministik
        rollout_percentage = flag.get("rollout_percentage", 0)
        
        # Tenant slug'ı hash'le ve yüzdelik dilime bak
        # Deterministik olması için her zaman aynı sonucu vermeli
        tenant_hash = hash(tenant_slug) % 100
        
        if tenant_hash < rollout_percentage:
            return {
                "key": flag_key,
                "enabled": True,
                "reason": f"rollout_{rollout_percentage}%"
            }
        return {
            "key": flag_key,
            "enabled": False,
            "reason": f"rollout_excluded_{rollout_percentage}%"
        }
    
    if status == "enabled":
        # Enabled durumunda, rol kontrolü kaldırıyoruz - herkes erişebilsin
        return {
            "key": flag_key,
            "enabled": True,
            "reason": "enabled"
        }
    
    # Bilinmeyen status
    return {
        "key": flag_key,
        "enabled": False,
        "reason": "unknown_status"
    }


@router.get("/{flag_key}/stats")
async def get_feature_flag_stats(flag_key: str):
    """
    Feature flag istatistikleri
    
    - Kaç tenant'ta aktif
    - Rollout durumu
    - Hata oranı (eğer tracking varsa)
    """
    collection = db["feature_flags"]
    
    flag = await collection.find_one({"key": flag_key})
    
    if not flag:
        raise HTTPException(status_code=404, detail=f"Feature flag '{flag_key}' bulunamadı")
    
    # TODO: Gerçek istatistikler için tracking ekle
    stats = {
        "key": flag_key,
        "status": flag.get("status"),
        "rollout_percentage": flag.get("rollout_percentage", 0),
        "whitelist_count": len(flag.get("whitelist_tenants", [])),
        "blacklist_count": len(flag.get("blacklist_tenants", [])),
        "created_at": flag.get("created_at"),
        "enabled_at": flag.get("enabled_at"),
        "estimated_active_tenants": "N/A"  # TODO: Hesapla
    }
    
    return stats


@router.post("/{flag_key}/rollout/{percentage}")
async def set_rollout_percentage(flag_key: str, percentage: int):
    """
    Rollout yüzdesini ayarla
    
    Kullanım:
    - POST /api/feature-flags/customer_v2/rollout/5   → %5
    - POST /api/feature-flags/customer_v2/rollout/25  → %25
    - POST /api/feature-flags/customer_v2/rollout/100 → %100 (full rollout)
    """
    if percentage < 0 or percentage > 100:
        raise HTTPException(status_code=400, detail="Yüzde 0-100 arasında olmalı")
    
    collection = db["feature_flags"]
    
    # Flag'i bul
    flag = await collection.find_one({"key": flag_key})
    if not flag:
        raise HTTPException(status_code=404, detail=f"Feature flag '{flag_key}' bulunamadı")
    
    # Status'u gradual yap ve yüzdeyi ayarla
    update_data = {
        "status": "gradual" if percentage < 100 else "enabled",
        "rollout_percentage": percentage,
        "updated_at": datetime.utcnow()
    }
    
    if percentage == 100:
        update_data["enabled_at"] = datetime.utcnow()
    
    await collection.update_one(
        {"key": flag_key},
        {"$set": update_data}
    )
    
    return {
        "message": f"Rollout {percentage}% olarak ayarlandı",
        "key": flag_key,
        "status": update_data["status"],
        "rollout_percentage": percentage
    }


# ============================================================
# BATCH OPERATIONS
# ============================================================

@router.post("/batch/check")
async def batch_check_feature_flags(tenant_slug: str, flag_keys: List[str]):
    """
    Birden fazla flag'i tek seferde kontrol et
    
    Frontend'de sayfa yüklenirken tüm flag'leri çekmek için kullanılır.
    """
    collection = db["feature_flags"]
    
    results = {}
    
    for key in flag_keys:
        flag = await collection.find_one({"key": key})
        
        if not flag:
            results[key] = {"enabled": False, "reason": "not_found"}
            continue
        
        # Basitleştirilmiş kontrol
        if tenant_slug in flag.get("blacklist_tenants", []):
            results[key] = {"enabled": False, "reason": "blacklist"}
        elif tenant_slug in flag.get("whitelist_tenants", []):
            results[key] = {"enabled": True, "reason": "whitelist"}
        elif flag.get("status") == "enabled":
            results[key] = {"enabled": True, "reason": "enabled"}
        elif flag.get("status") == "gradual":
            tenant_hash = hash(tenant_slug) % 100
            percentage = flag.get("rollout_percentage", 0)
            results[key] = {
                "enabled": tenant_hash < percentage,
                "reason": f"rollout_{percentage}%"
            }
        else:
            results[key] = {"enabled": False, "reason": flag.get("status", "disabled")}
    
    return results


# ============================================================
# SEED DATA
# ============================================================

@router.post("/seed")
async def seed_feature_flags():
    """
    Feature flag'leri seed et
    
    Tüm flag'leri temizleyip yeniden oluşturur.
    """
    from datetime import datetime, timezone
    collection = db["feature_flags"]
    
    # Önce mevcut flag'leri temizle
    await collection.delete_many({})
    print("🗑️  Eski flag'ler temizlendi")
    
    now = datetime.now(timezone.utc)
    
    default_flags = [
        {
            "flag": "demo_module",
            "name": "Demo Modülü",
            "description": "Geliştirme aşamasındaki yeni özellikleri test etmek için demo modülü",
            "status": "enabled",
            "created_at": now,
            "updated_at": now,
            "enabled_for_roles": ["super-admin", "admin"],
            "enabled_for_users": [],
            "rollout_percentage": 0,
            "metadata": {
                "category": "module",
                "priority": "high"
            }
        },
        {
            "flag": "customer_module_v2",
            "name": "Müşteri Modülü V2",
            "description": "Gelişmiş müşteri yönetimi - bulk seçim, 360° görünüm, Kanban",
            "status": "development",
            "created_at": now,
            "updated_at": now,
            "enabled_for_roles": ["super-admin", "admin"],
            "enabled_for_users": [],
            "rollout_percentage": 0,
            "metadata": {
                "category": "module",
                "priority": "medium"
            }
        },
        {
            "flag": "dashboard_v2",
            "name": "Dashboard V2",
            "description": "Yeni modern dashboard tasarımı - özelleştirilebilir widget'lar",
            "status": "development",
            "created_at": now,
            "updated_at": now,
            "enabled_for_roles": ["super-admin", "admin"],
            "enabled_for_users": [],
            "rollout_percentage": 0,
            "metadata": {
                "category": "module",
                "priority": "medium"
            }
        },
        {
            "flag": "email_threads",
            "name": "E-posta Thread Sistemi",
            "description": "Müşteri e-posta yazışmalarını CRM içinde görüntüleme",
            "status": "development",
            "created_at": now,
            "updated_at": now,
            "enabled_for_roles": ["super-admin", "admin"],
            "enabled_for_users": [],
            "rollout_percentage": 0,
            "metadata": {
                "category": "feature",
                "priority": "low"
            }
        },
        {
            "flag": "lead_generation",
            "name": "Lead Generation",
            "description": "Apollo.io ve RocketReach entegrasyonu - kredi bazlı lead bulma",
            "status": "disabled",
            "created_at": now,
            "updated_at": now,
            "enabled_for_roles": [],
            "enabled_for_users": [],
            "rollout_percentage": 0,
            "metadata": {
                "category": "integration",
                "priority": "low",
                "planned_release": "Q2 2025"
            }
        },
        {
            "flag": "ai_features",
            "name": "AI Özellikleri",
            "description": "Yapay zeka destekli özellikler - stand tasarım, teklif oluşturma",
            "status": "disabled",
            "created_at": now,
            "updated_at": now,
            "enabled_for_roles": ["super-admin"],
            "enabled_for_users": [],
            "rollout_percentage": 0,
            "metadata": {
                "category": "ai",
                "priority": "experimental",
                "requires_api_key": True
            }
        }
    ]
    
    # Tüm flag'leri insert et
    if default_flags:
        result = await collection.insert_many(default_flags)
        created = len(result.inserted_ids)
    else:
        created = 0
    
    print(f"✅ {created} flag oluşturuldu")
    
    return {
        "success": True,
        "message": "Feature flags seed tamamlandı",
        "created": created,
        "flags": [f["flag"] for f in default_flags]
    }
