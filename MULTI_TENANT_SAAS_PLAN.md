# 🏗️ MULTI-TENANT SAAS ALTYAPI MİMARİSİ - DETAYLI PLAN

**Hazırlanma Tarihi:** 7 Aralık 2025  
**Versiyon:** 1.0  
**Durum:** Analiz ve Planlama Tamamlandı - **UYGULAMA AŞAMASINA HAZIR**

---

## 📋 İÇİNDEKİLER

1. [Mevcut Durum Analizi](#1-mevcut-durum-analizi)
2. [Hedef Mimari](#2-hedef-mimari)
3. [Database Şemaları](#3-database-şemaları)
4. [Migrasyon Planı](#4-migrasyon-plani)
5. [Yeni Endpoint'ler](#5-yeni-endpointler)
6. [Frontend Değişiklikleri](#6-frontend-değişiklikleri)
7. [Güvenlik ve Yetkilendirme](#7-güvenlik-ve-yetkilendirme)
8. [Test Stratejisi](#8-test-stratejisi)
9. [Deployment Stratejisi](#9-deployment-stratejisi)
10. [Risk Analizi ve Çözümler](#10-risk-analizi)

---

## 1. MEVCUT DURUM ANALİZİ

### 1.1 Mevcut Database'ler

```
📦 MongoDB Databases (7 adet):
├── crm_db (0.32 MB)           ← ANA DATABASE (seed verileri)
├── vitingo_crm (0.64 MB)      ← ESKİ TENANT VERİLERİ (32 müşteri)
├── vitingo (0.21 MB)          ← Kullanılmıyor
├── fairmanager (0.04 MB)      ← Kullanılmıyor
├── test_database (18.23 MB)   ← Test verisi
├── admin (0.04 MB)            ← MongoDB system
└── config (0.11 MB)           ← MongoDB system
```

### 1.2 crm_db Collection Yapısı

```
crm_db (Global Data - Platform Level):
├── feature_flags      → 6 kayıt    ← Feature flag tanımları
├── packages           → 3 kayıt    ← Subscription paketleri
├── countries          → 196 kayıt  ← Global ülke verisi
├── currencies         → 161 kayıt  ← Global para birimi verisi
├── languages          → 15 kayıt   ← Global dil verisi
└── cities             → 101 kayıt  ← Global şehir verisi
```

**✅ Mevcut Durum:** `crm_db` global/platform-level veriler için kullanılıyor. Tenant-specific veriler yok.

### 1.3 vitingo_crm Collection Yapısı

```
vitingo_crm (Tenant Data - quattro-stand için taşınacak):
├── customers          → 32 kayıt   ← Müşteriler
├── products           → 47 kayıt   ← Ürünler
├── leads              → 4 kayıt    ← Potansiyel müşteriler
├── calendar_events    → 1 kayıt    ← Takvim etkinlikleri
├── countries          → 89 kayıt   ← Eski global data (silinecek)
├── cities             → 60 kayıt   ← Eski global data (silinecek)
└── positions          → 0 kayıt    ← Kullanılmıyor
```

**⚠️ Sorun:** `vitingo_crm` içinde hem tenant verileri hem de eski global data karışık.

### 1.4 Mevcut Tenant Slug Kullanımı

**Backend (server.py):**
```python
@app.get("/api/tenants/{tenant_slug}")
async def get_tenant(tenant_slug: str):
    # Tek endpoint var, gerçek tenant routing yok
    tenant = await db.tenants.find_one({"slug": tenant_slug})
```

**Frontend (TenantContext.jsx):**
```javascript
const { tenantSlug } = useParams();  // URL'den alınıyor: /{tenantSlug}/...
fetch(`${backendUrl}/api/tenants/${tenantSlug}`)
```

**Mevcut URL Yapısı:**
- ✅ Frontend: `/{tenantSlug}/dashboard` (quattro-stand/dashboard)
- ❌ Backend: Tenant-aware değil, tüm endpoint'ler `crm_db` kullanıyor

### 1.5 API Endpoint'lerin Tenant-Awareness Durumu

| Endpoint | Tenant-Aware? | Database | Notlar |
|----------|---------------|----------|--------|
| `/api/tenants/{slug}` | ✅ Kısmen | crm_db.tenants | Sadece tenant bilgisi döndürür |
| `/api/customers/*` | ❌ Hayır | Sabit DB | Database routing yok |
| `/api/projects/*` | ❌ Hayır | Sabit DB | Database routing yok |
| `/api/global/*` | ✅ Global | crm_db | Global veriler, tenant'tan bağımsız |
| `/api/feature-flags/*` | ⚠️ Kısmen | crm_db | Tenant slug parametre olarak alıyor |

**Sonuç:** API endpoint'lerin %90'ı tenant-aware değil. Database routing mevcut değil.

### 1.6 Teknik Mimari Analizi

**Güçlü Yönler:**
- ✅ TenantContext zaten var
- ✅ URL routing tenant slug içeriyor
- ✅ Feature flag sistemi hazır
- ✅ Global data ayrıştırılmış (crm_db)

**Zayıf Yönler:**
- ❌ Database routing yok
- ❌ Tenant izolasyonu yok
- ❌ Subscription yönetimi yok
- ❌ Tenant onboarding süreci yok

---

## 2. HEDEF MİMARİ

### 2.1 Database Stratejisi: **Hybrid Approach**

```
┌─────────────────────────────────────────────────────────────┐
│                    VITINGO PLATFORM                         │
│                  (Multi-Tenant SaaS)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐         ┌────────▼──────────┐
        │ vitingo_platform│         │  vitingo_t_{slug} │
        │  (Platform DB)  │         │   (Tenant DBs)    │
        └────────┬────────┘         └────────┬──────────┘
                 │                           │
    ┌────────────┼────────────┐    ┌─────────┼────────┐
    │            │            │    │         │        │
    ▼            ▼            ▼    ▼         ▼        ▼
  tenants    feature_flags  packages  customers  projects  ...
  users      global_data    invoices  leads      products
  subscriptions              
```

### 2.2 Database Seçim Kriterleri

**Option 1: Shared DB + Tenant Column** ❌
- Tüm tenant'lar aynı collection'da
- Her kayıtta `tenant_id` kolonu
- **Sorunlar:** Güvenlik riski, performans, veri sızıntısı

**Option 2: Separate Collections per Tenant** ❌
- Her tenant için ayrı collection: `customers_quattro`, `customers_acme`
- **Sorunlar:** Collection sayısı patlar, yönetim karmaşık

**Option 3: Database per Tenant** ✅ **SEÇİLEN**
- Her tenant için ayrı database: `vitingo_t_quattro_stand`, `vitingo_t_acme_corp`
- **Avantajlar:**
  - ✅ Tam izolasyon
  - ✅ Backup/restore kolaylığı
  - ✅ Performance isolation
  - ✅ Güvenlik (tenant verileri fiziksel olarak ayrı)
  - ✅ GDPR compliance (tenant isterse tüm verisi silinir)

### 2.3 Database Routing Stratejisi

```python
# Middleware: Tenant Database Resolver
async def get_tenant_db(tenant_slug: str):
    """
    Her istekte tenant_slug'a göre doğru database'i döndürür
    """
    if not tenant_slug:
        raise HTTPException(status_code=400, detail="Tenant slug required")
    
    # Platform DB'den tenant doğrula
    platform_db = client["vitingo_platform"]
    tenant = await platform_db.tenants.find_one({"slug": tenant_slug})
    
    if not tenant or not tenant.get("is_active"):
        raise HTTPException(status_code=404, detail="Tenant not found or inactive")
    
    # Tenant database'ine bağlan
    tenant_db_name = f"vitingo_t_{tenant_slug}"
    return client[tenant_db_name]
```

**Request Flow:**
```
User Request
  ↓
[Frontend: /{tenant_slug}/customers]
  ↓
[Backend: /api/customers]
  ↓
[Middleware: Extract tenant_slug from header/token]
  ↓
[Tenant DB Resolver: vitingo_t_{slug}]
  ↓
[Execute Query on Correct DB]
  ↓
Response
```

---

## 3. DATABASE ŞEMALARI

### 3.1 vitingo_platform (Platform Database)

**Amaç:** Tüm tenant'lar için ortak veriler, global ayarlar, subscription yönetimi

#### 3.1.1 tenants Collection

```javascript
{
  "_id": ObjectId(),
  "id": "ten_2J9x4k1pQm",  // Unique tenant ID
  "slug": "quattro-stand",  // URL-friendly unique identifier
  "name": "Quattro Stand",  // Display name
  "domain": "quattro.example.com",  // Custom domain (optional)
  "status": "active",  // active, suspended, cancelled, trial
  "created_at": ISODate("2025-12-01T00:00:00Z"),
  "trial_ends_at": ISODate("2025-12-15T00:00:00Z"),
  "subscription": {
    "package_key": "professional",
    "status": "active",  // trial, active, past_due, cancelled
    "billing_cycle": "monthly",  // monthly, yearly
    "current_period_start": ISODate("2025-12-01T00:00:00Z"),
    "current_period_end": ISODate("2026-01-01T00:00:00Z"),
    "stripe_subscription_id": "sub_1234567890",
    "stripe_customer_id": "cus_1234567890"
  },
  "settings": {
    "timezone": "Europe/Istanbul",
    "language": "tr",
    "currency": "TRY",
    "features": {
      "max_users": 10,
      "max_customers": 1000,
      "api_rate_limit": 1000  // per hour
    }
  },
  "owner": {
    "user_id": "usr_AbC123",
    "email": "owner@quattro.com",
    "name": "Murat Bucak"
  },
  "billing": {
    "company_name": "Quattro Stand Tic. Ltd. Şti.",
    "tax_number": "1234567890",
    "tax_office": "Beşiktaş",
    "address": "...",
    "country": "TR"
  },
  "metadata": {
    "industry": "exhibition",
    "company_size": "small",
    "onboarding_completed": true,
    "referral_source": "google"
  }
}
```

**İndeksler:**
- `slug` (unique)
- `status`
- `subscription.stripe_customer_id`
- `created_at`

#### 3.1.2 users Collection (Platform-Level Users)

```javascript
{
  "_id": ObjectId(),
  "id": "usr_AbC123",
  "tenant_id": "ten_2J9x4k1pQm",  // Foreign key to tenants
  "email": "user@quattro.com",
  "password_hash": "$2b$12$...",  // bcrypt hash
  "name": "Ali Veli",
  "role": "admin",  // super_admin, admin, user, viewer
  "status": "active",  // active, suspended, invited
  "avatar_url": "https://...",
  "last_login": ISODate("2025-12-07T10:00:00Z"),
  "created_at": ISODate("2025-12-01T00:00:00Z"),
  "permissions": ["customers.read", "customers.write", "projects.read"],
  "preferences": {
    "language": "tr",
    "notifications": {
      "email": true,
      "push": false
    }
  }
}
```

**İndeksler:**
- `email` (unique)
- `tenant_id`
- `tenant_id + role`

#### 3.1.3 feature_flags Collection

```javascript
{
  "_id": ObjectId(),
  "key": "demo_module",
  "name": "Demo Modülü",
  "description": "Geliştirme aşamasındaki özellikleri test etmek için",
  "status": "enabled",  // enabled, disabled, development, planned
  "enabled_for_roles": ["super_admin", "admin"],
  "config": {
    "rollout_percentage": 100,  // 0-100
    "whitelist_tenants": ["quattro-stand"],
    "blacklist_tenants": [],
    "requires_package": null  // or "professional"
  },
  "created_at": ISODate("2025-11-01T00:00:00Z"),
  "updated_at": ISODate("2025-12-01T00:00:00Z")
}
```

#### 3.1.4 packages Collection

```javascript
{
  "_id": ObjectId(),
  "key": "professional",
  "name": "Professional",
  "name_tr": "Profesyonel",
  "description": "Orta ölçekli işletmeler için",
  "price_monthly": 299,
  "price_yearly": 2990,
  "currency": "TRY",
  "features": {
    "max_users": 10,
    "max_customers": 1000,
    "max_projects": 100,
    "max_storage_gb": 50,
    "custom_domain": true,
    "api_access": true,
    "priority_support": true,
    "feature_flags": ["customer_module_v2", "dashboard_v2"]
  },
  "stripe_price_id_monthly": "price_1ABC",
  "stripe_price_id_yearly": "price_2DEF",
  "is_active": true,
  "sort_order": 2
}
```

#### 3.1.5 global_* Collections (Mevcut crm_db'den taşınacak)

- `global_currencies` (161 kayıt)
- `global_countries` (196 kayıt)
- `global_cities` (101 kayıt)
- `global_languages` (15 kayıt)

**Not:** Collection isimleri `global_` prefix'i alacak, mevcut `currencies`, `countries` vs. yerine.

#### 3.1.6 invoices Collection (Platform-Level Faturalar)

```javascript
{
  "_id": ObjectId(),
  "id": "inv_ABC123",
  "tenant_id": "ten_2J9x4k1pQm",
  "invoice_number": "2025-001",
  "amount": 299.00,
  "currency": "TRY",
  "status": "paid",  // draft, sent, paid, overdue, cancelled
  "stripe_invoice_id": "in_1234567890",
  "period_start": ISODate("2025-12-01T00:00:00Z"),
  "period_end": ISODate("2026-01-01T00:00:00Z"),
  "due_date": ISODate("2025-12-10T00:00:00Z"),
  "paid_at": ISODate("2025-12-05T00:00:00Z"),
  "items": [
    {
      "description": "Professional Plan - Monthly",
      "quantity": 1,
      "unit_price": 299.00,
      "total": 299.00
    }
  ],
  "created_at": ISODate("2025-12-01T00:00:00Z")
}
```

### 3.2 vitingo_t_{slug} (Tenant Databases)

**Amaç:** Her tenant'ın kendi iş verileri, tamamen izole

#### 3.2.1 customers Collection

```javascript
{
  "_id": ObjectId(),
  "id": "cus_XyZ789",
  "companyName": "Anadolu Holding",
  "companyTitle": "Anadolu Endüstri Holding A.Ş.",
  "email": "info@anadolu.com",
  "phone": "+90 212 300 10 20",
  "country": "TR",
  "city": "İstanbul",
  "address": "...",
  "sector": "Holding",
  "relationshipType": "Müşteri",
  "status": "active",
  "customerSince": ISODate("2025-01-01T00:00:00Z"),
  "totalRevenue": 100000,
  "currency": "TRY",
  "contactPerson": "...",
  "tags": ["vip", "aktif"],
  "created_by": "usr_AbC123",  // Platform user ID
  "created_at": ISODate("2025-01-01T00:00:00Z"),
  "updated_at": ISODate("2025-12-01T00:00:00Z")
}
```

#### 3.2.2 projects Collection

```javascript
{
  "_id": ObjectId(),
  "id": "prj_123Abc",
  "projectNumber": "PR-25-10001",
  "name": "Propshop - Özel Tasarım Projesi",
  "customerId": "cus_XyZ789",
  "customerName": "Propshop",
  "fair": "Business Analyst World - Washington",
  "city": "Washington D.C.",
  "country": "US",
  "status": "active",
  "contractAmount": 1000,
  "currency": "USD",
  "startDate": ISODate("2026-01-01T00:00:00Z"),
  "endDate": ISODate("2026-01-05T00:00:00Z"),
  "assignedTo": ["usr_AbC123"],
  "created_by": "usr_AbC123",
  "created_at": ISODate("2025-12-01T00:00:00Z"),
  "updated_at": ISODate("2025-12-05T00:00:00Z")
}
```

#### 3.2.3 Diğer Tenant Collections

- `products` (Ürünler)
- `leads` (Potansiyel müşteriler)
- `calendar_events` (Takvim etkinlikleri)
- `tasks` (Görevler)
- `documents` (Dökümanlar)
- `activities` (Aktivite logları)
- `settings` (Tenant-specific ayarlar)

---

## 4. MİGRASYON PLANI

### 4.1 Migrasyon Stratejisi: **Blue-Green Deployment**

**Amaç:** Sıfır kesinti ile mevcut sistemden yeni multi-tenant mimariye geçiş

### 4.2 Migrasyon Aşamaları

#### PHASE 0: Hazırlık (1 gün)

**Görevler:**
1. ✅ Mevcut durum analizi (TAMAMLANDI)
2. ✅ Detaylı plan hazırlama (TAMAMLANDI)
3. ⏳ Backup alma (tüm database'ler)
4. ⏳ Test ortamı kurulumu

**Backup Komutları:**
```bash
# Tüm database'leri backup al
mongodump --out=/backup/pre-migration-$(date +%Y%m%d)

# Sadece önemli database'ler
mongodump --db=crm_db --out=/backup/crm_db
mongodump --db=vitingo_crm --out=/backup/vitingo_crm
```

#### PHASE 1: Platform Database Kurulumu (2 gün)

**1.1 vitingo_platform Database Oluştur**

```javascript
// Script: /app/backend/migrations/001_create_platform_db.py

use vitingo_platform;

// 1. Tenants collection oluştur
db.createCollection("tenants");
db.tenants.createIndex({"slug": 1}, {unique: true});
db.tenants.createIndex({"status": 1});

// 2. Users collection oluştur
db.createCollection("users");
db.users.createIndex({"email": 1}, {unique: true});
db.users.createIndex({"tenant_id": 1});

// 3. Feature flags migration (crm_db -> vitingo_platform)
db.createCollection("feature_flags");
// Mevcut crm_db.feature_flags verilerini kopyala

// 4. Packages migration (crm_db -> vitingo_platform)
db.createCollection("packages");
// Mevcut crm_db.packages verilerini kopyala

// 5. Global data migration (crm_db -> vitingo_platform)
db.createCollection("global_currencies");
db.createCollection("global_countries");
db.createCollection("global_cities");
db.createCollection("global_languages");
// Mevcut crm_db.currencies -> global_currencies

// 6. Invoices collection
db.createCollection("invoices");
```

**Migration Script:**
```python
# /app/backend/migrations/001_migrate_to_platform_db.py

async def migrate_platform_db():
    source_db = client["crm_db"]
    target_db = client["vitingo_platform"]
    
    # 1. Migrate feature_flags
    flags = await source_db.feature_flags.find().to_list(None)
    if flags:
        await target_db.feature_flags.insert_many(flags)
    print(f"✅ Migrated {len(flags)} feature flags")
    
    # 2. Migrate packages
    packages = await source_db.packages.find().to_list(None)
    if packages:
        await target_db.packages.insert_many(packages)
    print(f"✅ Migrated {len(packages)} packages")
    
    # 3. Migrate global data with prefix
    for collection in ["currencies", "countries", "cities", "languages"]:
        data = await source_db[collection].find().to_list(None)
        if data:
            await target_db[f"global_{collection}"].insert_many(data)
        print(f"✅ Migrated {len(data)} {collection}")
```

#### PHASE 2: İlk Tenant Oluşturma - "quattro-stand" (1 gün)

**2.1 Quattro-stand Tenant Kaydı Oluştur**

```python
# /app/backend/migrations/002_create_first_tenant.py

async def create_first_tenant():
    platform_db = client["vitingo_platform"]
    
    tenant = {
        "id": "ten_quattro_001",
        "slug": "quattro-stand",
        "name": "Quattro Stand",
        "status": "active",
        "created_at": datetime.now(timezone.utc),
        "subscription": {
            "package_key": "professional",
            "status": "active",
            "billing_cycle": "yearly"
        },
        "settings": {
            "timezone": "Europe/Istanbul",
            "language": "tr",
            "currency": "TRY"
        },
        "owner": {
            "email": "admin@quattro.com",
            "name": "Murat Bucak"
        }
    }
    
    result = await platform_db.tenants.insert_one(tenant)
    print(f"✅ Created tenant: {tenant['slug']}")
    return tenant
```

**2.2 Tenant Database Oluştur**

```python
async def create_tenant_database(tenant_slug: str):
    tenant_db_name = f"vitingo_t_{tenant_slug}"
    tenant_db = client[tenant_db_name]
    
    # Create collections
    collections = [
        "customers", "projects", "leads", "products",
        "calendar_events", "tasks", "documents", "activities"
    ]
    
    for coll in collections:
        await tenant_db.create_collection(coll)
        print(f"✅ Created collection: {coll}")
    
    # Create indexes
    await tenant_db.customers.create_index("id", unique=True)
    await tenant_db.projects.create_index("projectNumber", unique=True)
    
    return tenant_db
```

#### PHASE 3: Veri Migrasyonu (2 gün)

**3.1 vitingo_crm -> vitingo_t_quattro_stand**

```python
# /app/backend/migrations/003_migrate_tenant_data.py

async def migrate_tenant_data():
    source_db = client["vitingo_crm"]
    target_db = client["vitingo_t_quattro_stand"]
    
    # 1. Migrate customers
    customers = await source_db.customers.find({}, {"_id": 0}).to_list(None)
    if customers:
        # Clean old global data references
        for customer in customers:
            # Ülke kodları zaten var, eski countries/cities'i temizle
            pass
        
        await target_db.customers.insert_many(customers)
    print(f"✅ Migrated {len(customers)} customers")
    
    # 2. Migrate products
    products = await source_db.products.find({}, {"_id": 0}).to_list(None)
    if products:
        await target_db.products.insert_many(products)
    print(f"✅ Migrated {len(products)} products")
    
    # 3. Migrate leads
    leads = await source_db.leads.find({}, {"_id": 0}).to_list(None)
    if leads:
        await target_db.leads.insert_many(leads)
    print(f"✅ Migrated {len(leads)} leads")
    
    # 4. Migrate calendar_events
    events = await source_db.calendar_events.find({}, {"_id": 0}).to_list(None)
    if events:
        await target_db.calendar_events.insert_many(events)
    print(f"✅ Migrated {len(events)} calendar events")
```

**3.2 Veri Doğrulama**

```python
async def validate_migration():
    source_db = client["vitingo_crm"]
    target_db = client["vitingo_t_quattro_stand"]
    
    validations = []
    
    # Check counts
    for collection in ["customers", "products", "leads"]:
        source_count = await source_db[collection].count_documents({})
        target_count = await target_db[collection].count_documents({})
        
        if source_count == target_count:
            print(f"✅ {collection}: {source_count} = {target_count}")
            validations.append(True)
        else:
            print(f"❌ {collection}: {source_count} != {target_count}")
            validations.append(False)
    
    return all(validations)
```

#### PHASE 4: Backend Code Refactoring (3 gün)

**4.1 Database Router Middleware**

```python
# /app/backend/middleware/tenant_db_router.py

from fastapi import Request, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

class TenantDatabaseRouter:
    def __init__(self, mongo_client: AsyncIOMotorClient):
        self.client = mongo_client
        self.platform_db = mongo_client["vitingo_platform"]
    
    async def get_tenant_db(self, request: Request):
        """
        Extract tenant_slug from request and return tenant database
        """
        # Option 1: From URL path /{tenant_slug}/api/...
        tenant_slug = request.path_params.get("tenant_slug")
        
        # Option 2: From JWT token
        if not tenant_slug:
            token = request.headers.get("Authorization")
            if token:
                # Decode JWT and extract tenant_slug
                pass
        
        # Option 3: From custom header
        if not tenant_slug:
            tenant_slug = request.headers.get("X-Tenant-Slug")
        
        if not tenant_slug:
            raise HTTPException(status_code=400, detail="Tenant slug not found")
        
        # Validate tenant exists and is active
        tenant = await self.platform_db.tenants.find_one({
            "slug": tenant_slug,
            "status": "active"
        })
        
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found or inactive")
        
        # Return tenant database
        tenant_db_name = f"vitingo_t_{tenant_slug}"
        return self.client[tenant_db_name], tenant
```

**4.2 Dependency Injection**

```python
# /app/backend/dependencies.py

from fastapi import Depends, Request

async def get_tenant_context(request: Request):
    """
    Dependency that provides tenant context to endpoints
    """
    router = TenantDatabaseRouter(mongo_client)
    tenant_db, tenant = await router.get_tenant_db(request)
    
    return {
        "tenant_db": tenant_db,
        "tenant": tenant,
        "tenant_slug": tenant["slug"]
    }

# Usage in endpoints:
@router.get("/api/{tenant_slug}/customers")
async def list_customers(
    tenant_slug: str,
    ctx: dict = Depends(get_tenant_context)
):
    tenant_db = ctx["tenant_db"]
    customers = await tenant_db.customers.find().to_list(100)
    return customers
```

**4.3 Endpoint Refactoring Pattern**

**Eski (Tenant-unaware):**
```python
@app.get("/api/customers")
async def list_customers():
    customers = await db.customers.find().to_list(100)
    return customers
```

**Yeni (Tenant-aware):**
```python
@app.get("/api/{tenant_slug}/customers")
async def list_customers(
    tenant_slug: str,
    ctx: dict = Depends(get_tenant_context)
):
    tenant_db = ctx["tenant_db"]
    customers = await tenant_db.customers.find().to_list(100)
    return customers
```

**Not:** Tüm `/api/customers`, `/api/projects`, `/api/leads` endpoint'leri bu pattern'e göre güncellenecek.

#### PHASE 5: Frontend Güncellemeleri (2 gün)

**5.1 API Client Güncelleme**

```javascript
// /app/frontend/src/api/client.js

const API_BASE = process.env.REACT_APP_BACKEND_URL;

export const apiClient = {
  async fetch(endpoint, options = {}) {
    const { tenantSlug } = useTenant();
    
    // Add tenant_slug to URL
    const url = `${API_BASE}/api/${tenantSlug}${endpoint}`;
    
    // Add auth token
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
};

// Usage:
const customers = await apiClient.fetch("/customers");
// Calls: /api/quattro-stand/customers
```

#### PHASE 6: Testing (3 gün)

**Test Scenarios:**

1. ✅ **Tenant Isolation Test**
   - Quattro-stand verileri başka tenant'tan erişilemiyor mu?
   - Database routing doğru çalışıyor mu?

2. ✅ **Backward Compatibility Test**
   - Mevcut frontend kod değişmeden çalışıyor mu?
   - Eski URL'ler redirect ediliyor mu?

3. ✅ **Performance Test**
   - Database routing overhead'i ne kadar?
   - Multiple tenant'lar için response time?

4. ✅ **Feature Flag Test**
   - Feature flag sistemi tenant-aware çalışıyor mu?
   - Package-based restrictions aktif mi?

#### PHASE 7: Production Deployment (1 gün)

**Deployment Stratejisi: Canary Release**

1. **10% Trafik:** Yeni sistem (quattro-stand)
2. **Monitoring:** 2 saat
3. **50% Trafik:** Hata yoksa
4. **Monitoring:** 4 saat
5. **100% Trafik:** Tamamen yeni sistem

**Rollback Plan:**
- Herhangi bir hata durumundaeski sistem aktif
- Database değişmedi, sadece routing değişti
- 5 dakika içinde eski sisteme dönülebilir

### 4.3 Migration Timeline

```
Week 1:
├── Day 1-2: PHASE 1 (Platform DB setup)
├── Day 3: PHASE 2 (First tenant creation)
└── Day 4-5: PHASE 3 (Data migration)

Week 2:
├── Day 1-3: PHASE 4 (Backend refactoring)
├── Day 4-5: PHASE 5 (Frontend updates)

Week 3:
├── Day 1-3: PHASE 6 (Testing)
└── Day 4: PHASE 7 (Production deployment)

Total: 15 iş günü (3 hafta)
```

---

## 5. YENİ ENDPOINT'LER

### 5.1 Platform Admin API

**Base URL:** `/api/platform`

#### 5.1.1 Tenant Management

```python
# POST /api/platform/tenants
@router.post("/platform/tenants")
async def create_tenant(
    tenant_data: TenantCreate,
    current_user: dict = Depends(require_super_admin)
):
    """
    Create a new tenant (Super Admin only)
    
    Body:
    {
      "slug": "acme-corp",
      "name": "Acme Corporation",
      "owner_email": "owner@acme.com",
      "owner_name": "John Doe",
      "package_key": "professional",
      "billing_cycle": "monthly"
    }
    """
    # 1. Validate slug uniqueness
    # 2. Create tenant in vitingo_platform.tenants
    # 3. Create tenant database: vitingo_t_acme_corp
    # 4. Create owner user
    # 5. Send welcome email
    # 6. Return tenant info
    pass

# GET /api/platform/tenants
@router.get("/platform/tenants")
async def list_tenants(
    status: str = Query(None),
    package: str = Query(None),
    current_user: dict = Depends(require_super_admin)
):
    """List all tenants (Super Admin only)"""
    pass

# PUT /api/platform/tenants/{tenant_id}/status
@router.put("/platform/tenants/{tenant_id}/status")
async def update_tenant_status(
    tenant_id: str,
    status: str,  # active, suspended, cancelled
    current_user: dict = Depends(require_super_admin)
):
    """Suspend or activate tenant"""
    pass

# DELETE /api/platform/tenants/{tenant_id}
@router.delete("/platform/tenants/{tenant_id}")
async def delete_tenant(
    tenant_id: str,
    confirm: bool = Query(...),
    current_user: dict = Depends(require_super_admin)
):
    """
    Delete tenant and all data (DESTRUCTIVE - Super Admin only)
    
    Steps:
    1. Cancel Stripe subscription
    2. Export tenant data (backup)
    3. Drop tenant database
    4. Mark tenant as deleted in platform
    """
    pass
```

#### 5.1.2 Subscription Management

```python
# POST /api/platform/subscriptions/{tenant_id}/upgrade
@router.post("/platform/subscriptions/{tenant_id}/upgrade")
async def upgrade_subscription(
    tenant_id: str,
    new_package: str,
    billing_cycle: str
):
    """
    Upgrade/downgrade tenant subscription
    
    Steps:
    1. Update Stripe subscription
    2. Update tenant.subscription
    3. Apply new limits immediately
    """
    pass

# POST /api/platform/subscriptions/{tenant_id}/cancel
@router.post("/platform/subscriptions/{tenant_id}/cancel")
async def cancel_subscription(tenant_id: str, cancel_at_period_end: bool = True):
    """Cancel subscription (Stripe)"""
    pass
```

### 5.2 Tenant Onboarding API

**Base URL:** `/api/onboarding`

```python
# POST /api/onboarding/signup
@router.post("/onboarding/signup")
async def tenant_signup(signup_data: TenantSignup):
    """
    Self-service tenant registration
    
    Body:
    {
      "company_name": "My Company",
      "owner_email": "owner@company.com",
      "owner_name": "John Doe",
      "password": "secure123",
      "package_key": "starter",
      "billing_cycle": "monthly"
    }
    
    Steps:
    1. Validate email uniqueness
    2. Generate unique slug from company_name
    3. Create tenant (14-day trial)
    4. Create tenant database
    5. Create owner user
    6. Send verification email
    7. Return onboarding token
    """
    pass

# POST /api/onboarding/{tenant_slug}/verify
@router.post("/onboarding/{tenant_slug}/verify")
async def verify_tenant(tenant_slug: str, token: str):
    """Verify email and activate tenant"""
    pass

# POST /api/onboarding/{tenant_slug}/complete
@router.post("/onboarding/{tenant_slug}/complete")
async def complete_onboarding(
    tenant_slug: str,
    onboarding_data: OnboardingComplete
):
    """
    Complete onboarding wizard
    
    Body:
    {
      "company_info": {...},
      "billing_info": {...},
      "preferences": {...}
    }
    """
    pass
```

### 5.3 Stripe Webhook API

```python
# POST /api/webhooks/stripe
@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    """
    Handle Stripe events
    
    Events:
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.payment_succeeded
    - invoice.payment_failed
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    # Verify webhook signature
    event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    
    if event.type == "customer.subscription.updated":
        # Update tenant subscription status
        pass
    
    elif event.type == "invoice.payment_failed":
        # Suspend tenant or send notification
        pass
    
    return {"received": True}
```

### 5.4 Analytics API (Future)

```python
# GET /api/platform/analytics/usage
@router.get("/platform/analytics/usage")
async def platform_usage_analytics(
    start_date: date,
    end_date: date,
    current_user: dict = Depends(require_super_admin)
):
    """
    Platform-wide analytics
    
    Returns:
    {
      "total_tenants": 150,
      "active_tenants": 142,
      "trial_tenants": 8,
      "total_revenue": 45000,
      "monthly_recurring_revenue": 15000,
      "churn_rate": 2.5,
      "by_package": {...}
    }
    """
    pass
```

---

## 6. FRONTEND DEĞİŞİKLİKLERİ

### 6.1 TenantContext Güncellemeleri

**Mevcut Durum:**
```javascript
// /app/frontend/src/contexts/TenantContext.jsx (MEVCUT)

export const TenantProvider = ({ children }) => {
  const { tenantSlug } = useParams();
  const [tenant, setTenant] = useState(null);
  
  useEffect(() => {
    // Fetch tenant from /api/tenants/{slug}
    fetch(`${backendUrl}/api/tenants/${tenantSlug}`)
      .then(res => res.json())
      .then(setTenant);
  }, [tenantSlug]);
  
  return (
    <TenantContext.Provider value={{ tenant, tenantSlug }}>
      {children}
    </TenantContext.Provider>
  );
};
```

**Yeni Durum:**
```javascript
// /app/frontend/src/contexts/TenantContext.jsx (GÜNCELLENMİŞ)

export const TenantProvider = ({ children }) => {
  const { tenantSlug } = useParams();
  const [tenant, setTenant] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [limits, setLimits] = useState({});
  
  useEffect(() => {
    if (!tenantSlug) return;
    
    // NEW: Fetch from updated endpoint
    fetch(`${backendUrl}/api/platform/tenants/by-slug/${tenantSlug}`)
      .then(res => res.json())
      .then(data => {
        setTenant(data);
        setSubscription(data.subscription);
        setLimits(data.settings.features);
      });
  }, [tenantSlug]);
  
  // NEW: Helper functions
  const hasFeature = (featureKey) => {
    return subscription?.package?.features?.includes(featureKey);
  };
  
  const checkLimit = (resource, current) => {
    const limit = limits[`max_${resource}`];
    return current < limit;
  };
  
  return (
    <TenantContext.Provider value={{ 
      tenant, 
      tenantSlug,
      subscription,
      limits,
      hasFeature,
      checkLimit
    }}>
      {children}
    </TenantContext.Provider>
  );
};
```

### 6.2 Login Flow Değişiklikleri

**Mevcut Flow:**
```
1. User enters credentials
2. POST /api/auth/login
3. Receive JWT token
4. Store in localStorage
5. Redirect to /quattro-stand/dashboard
```

**Yeni Flow:**
```
1. User enters email + password
2. POST /api/auth/login (email globally unique across platform)
3. Backend:
   - Find user in vitingo_platform.users
   - Get tenant_id from user record
   - Lookup tenant in vitingo_platform.tenants
   - Generate JWT with tenant_slug in payload
4. Frontend:
   - Receive JWT + tenant info
   - Store JWT in localStorage
   - Extract tenant_slug from JWT
   - Redirect to /{tenant_slug}/dashboard
```

**JWT Payload (NEW):**
```javascript
{
  "user_id": "usr_AbC123",
  "email": "user@quattro.com",
  "tenant_id": "ten_quattro_001",
  "tenant_slug": "quattro-stand",  // NEW
  "role": "admin",
  "exp": 1234567890
}
```

### 6.3 API Client Refactoring

**Yeni API Client:**
```javascript
// /app/frontend/src/api/client.js

import { useTenant } from '../contexts/TenantContext';

class APIClient {
  constructor() {
    this.baseURL = process.env.REACT_APP_BACKEND_URL;
  }
  
  async request(endpoint, options = {}) {
    // Get tenant slug from context or JWT
    const tenantSlug = this.getTenantSlug();
    
    // Build URL with tenant_slug
    const url = `${this.baseURL}/api/${tenantSlug}${endpoint}`;
    
    // Add auth headers
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Redirect to login
        window.location.href = "/login";
      }
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
  
  getTenantSlug() {
    // Option 1: From URL
    const pathParts = window.location.pathname.split("/");
    if (pathParts.length > 1) {
      return pathParts[1];
    }
    
    // Option 2: From JWT
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.tenant_slug;
    }
    
    throw new Error("Tenant slug not found");
  }
  
  // Convenience methods
  get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }
  
  post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  
  put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }
  
  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }
}

export const api = new APIClient();

// Usage:
const customers = await api.get("/customers");
// Calls: /api/quattro-stand/customers
```

### 6.4 Yeni UI Komponentleri

#### 6.4.1 Subscription Status Banner

```javascript
// /app/frontend/src/components/SubscriptionBanner.jsx

export const SubscriptionBanner = () => {
  const { subscription, tenant } = useTenant();
  
  if (subscription.status === "trial") {
    const daysLeft = calculateDaysLeft(tenant.trial_ends_at);
    
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Deneme süreniz {daysLeft} gün sonra sona eriyor.
              <a href="/settings/billing" className="font-medium underline">
                Şimdi aboneliği başlat
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (subscription.status === "past_due") {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-sm text-red-700">
          Ödeme alınamadı. Lütfen ödeme bilgilerinizi güncelleyin.
        </p>
      </div>
    );
  }
  
  return null;
};
```

#### 6.4.2 Feature Gate Component

```javascript
// /app/frontend/src/components/FeatureGate.jsx

export const FeatureGate = ({ 
  featureKey, 
  fallback = null,
  children 
}) => {
  const { hasAccess } = useFeatureFlag(featureKey);
  const { hasFeature } = useTenant();
  
  // Check both feature flag AND subscription package
  const canAccess = hasAccess && hasFeature(featureKey);
  
  if (!canAccess) {
    return fallback || <UpgradePrompt featureKey={featureKey} />;
  }
  
  return <>{children}</>;
};

// Usage:
<FeatureGate featureKey="customer_module_v2">
  <CustomerV2Page />
</FeatureGate>
```

### 6.5 Onboarding Wizard (New Page)

```javascript
// /app/frontend/src/pages/onboarding/SignupWizard.jsx

export const SignupWizard = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  
  const steps = [
    { id: 1, name: "Şirket Bilgileri", component: <CompanyInfoStep /> },
    { id: 2, name: "Paket Seçimi", component: <PackageSelectionStep /> },
    { id: 3, name: "Ödeme Bilgileri", component: <PaymentStep /> },
    { id: 4, name: "Tamamlandı", component: <CompletionStep /> }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <StepIndicator steps={steps} currentStep={step} />
      
      <div className="max-w-2xl mx-auto py-12 px-4">
        {steps[step - 1].component}
      </div>
    </div>
  );
};
```

---

## 7. GÜVENLİK VE YETKİLENDİRME

### 7.1 Tenant İzolasyonu

**Kritik Güvenlik Kuralları:**

1. **Database Level Isolation**
   - Her tenant'ın kendi database'i
   - MongoDB connection pool per tenant
   - Cross-tenant query mümkün değil

2. **API Level Isolation**
   ```python
   # Her request'te tenant doğrulaması ZORUNLU
   async def validate_tenant(request: Request):
       tenant_slug = extract_tenant_slug(request)
       
       # JWT'deki tenant_slug ile URL'deki tenant_slug eşleşmeli
       token_tenant = request.state.user["tenant_slug"]
       if token_tenant != tenant_slug:
           raise HTTPException(403, "Tenant mismatch")
   ```

3. **User Level Isolation**
   - User'lar sadece kendi tenant'larına erişebilir
   - Super Admin hariç cross-tenant access yasak

### 7.2 Role-Based Access Control (RBAC)

**Roller:**

```python
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"  # Platform yöneticisi
    ADMIN = "admin"              # Tenant yöneticisi
    USER = "user"                # Normal kullanıcı
    VIEWER = "viewer"            # Sadece görüntüleme
```

**İzinler:**

```python
PERMISSIONS = {
    "super_admin": ["*"],  # Her şey
    "admin": [
        "customers.*",
        "projects.*",
        "users.read",
        "users.invite",
        "settings.*"
    ],
    "user": [
        "customers.read",
        "customers.write",
        "projects.read",
        "projects.write"
    ],
    "viewer": [
        "customers.read",
        "projects.read"
    ]
}
```

**Decorator:**

```python
def require_permission(permission: str):
    async def dependency(
        request: Request,
        current_user: dict = Depends(get_current_user)
    ):
        if not has_permission(current_user["role"], permission):
            raise HTTPException(403, "Permission denied")
        return current_user
    
    return Depends(dependency)

# Usage:
@router.post("/api/{tenant_slug}/customers")
async def create_customer(
    customer: CustomerCreate,
    user: dict = require_permission("customers.write")
):
    pass
```

### 7.3 Rate Limiting

**Per-Tenant Rate Limits:**

```python
# /app/backend/middleware/rate_limiter.py

from fastapi import HTTPException
from collections import defaultdict
from datetime import datetime, timedelta

class TenantRateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
    
    async def check_limit(self, tenant_slug: str, limit: int):
        now = datetime.now()
        hour_ago = now - timedelta(hours=1)
        
        # Remove old requests
        self.requests[tenant_slug] = [
            req for req in self.requests[tenant_slug]
            if req > hour_ago
        ]
        
        # Check limit
        if len(self.requests[tenant_slug]) >= limit:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded"
            )
        
        # Record request
        self.requests[tenant_slug].append(now)

# Usage in middleware:
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    tenant_slug = extract_tenant_slug(request)
    tenant = await get_tenant(tenant_slug)
    
    limit = tenant["settings"]["features"]["api_rate_limit"]
    await rate_limiter.check_limit(tenant_slug, limit)
    
    return await call_next(request)
```

---

## 8. TEST STRATEJİSİ

### 8.1 Unit Tests

```python
# /app/backend/tests/test_tenant_routing.py

import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_tenant_isolation():
    """Test: Tenant A cannot access Tenant B data"""
    
    # Create two test tenants
    tenant_a = await create_test_tenant("tenant-a")
    tenant_b = await create_test_tenant("tenant-b")
    
    # Create customer in tenant A
    customer_a = await create_customer(tenant_a, {"name": "Customer A"})
    
    # Try to access from tenant B (should fail)
    async with AsyncClient(app=app) as client:
        response = await client.get(
            f"/api/tenant-b/customers/{customer_a['id']}",
            headers={"Authorization": f"Bearer {tenant_b_token}"}
        )
        assert response.status_code == 404

@pytest.mark.asyncio
async def test_database_routing():
    """Test: Database routing works correctly"""
    
    tenant_slug = "test-tenant"
    
    # Create customer via API
    customer = await create_customer_via_api(tenant_slug, {...})
    
    # Verify it's in correct database
    tenant_db = client[f"vitingo_t_{tenant_slug}"]
    db_customer = await tenant_db.customers.find_one({"id": customer["id"]})
    
    assert db_customer is not None
    assert db_customer["name"] == customer["name"]
```

### 8.2 Integration Tests

```python
# /app/backend/tests/test_onboarding.py

@pytest.mark.asyncio
async def test_full_onboarding_flow():
    """Test: Complete tenant onboarding"""
    
    # 1. Signup
    signup_data = {
        "company_name": "Test Company",
        "owner_email": "owner@test.com",
        "password": "secure123",
        "package_key": "starter"
    }
    
    response = await client.post("/api/onboarding/signup", json=signup_data)
    assert response.status_code == 201
    tenant = response.json()
    
    # 2. Verify tenant created
    platform_db = client["vitingo_platform"]
    db_tenant = await platform_db.tenants.find_one({"slug": tenant["slug"]})
    assert db_tenant is not None
    
    # 3. Verify tenant database created
    tenant_db = client[f"vitingo_t_{tenant['slug']}"]
    collections = await tenant_db.list_collection_names()
    assert "customers" in collections
    
    # 4. Verify owner user created
    owner = await platform_db.users.find_one({"email": signup_data["owner_email"]})
    assert owner is not None
    assert owner["role"] == "admin"
```

### 8.3 Load Tests

```python
# /app/backend/tests/load_test.py

from locust import HttpUser, task, between

class TenantUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login
        response = self.client.post("/api/auth/login", json={
            "email": "user@test.com",
            "password": "test123"
        })
        self.token = response.json()["token"]
        self.tenant_slug = "test-tenant"
    
    @task(3)
    def list_customers(self):
        self.client.get(
            f"/api/{self.tenant_slug}/customers",
            headers={"Authorization": f"Bearer {self.token}"}
        )
    
    @task(1)
    def create_customer(self):
        self.client.post(
            f"/api/{self.tenant_slug}/customers",
            json={"name": "Test Customer"},
            headers={"Authorization": f"Bearer {self.token}"}
        )

# Run: locust -f load_test.py --host=http://localhost:8001
```

---

## 9. DEPLOYMENT STRATEJİSİ

### 9.1 Blue-Green Deployment

```
┌─────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                        │
│                  (Traffic Router)                       │
└────────────┬───────────────────────────────┬────────────┘
             │                               │
     ┌───────▼──────┐                ┌──────▼──────┐
     │  BLUE (OLD)  │                │ GREEN (NEW) │
     │   Version    │   Switch →     │   Version   │
     │   Current    │                │  Multi-Tenant│
     └──────────────┘                └─────────────┘
```

**Deployment Steps:**

1. **Prepare Green Environment**
   ```bash
   # 1. Deploy new code to green servers
   git pull origin main
   docker build -t vitingo-crm:green .
   
   # 2. Run migrations
   python /app/backend/migrations/run_all.py
   
   # 3. Start green servers
   docker-compose -f docker-compose.green.yml up -d
   ```

2. **Smoke Tests**
   ```bash
   # Test green environment
   pytest tests/smoke/ --env=green
   ```

3. **Traffic Shift**
   ```bash
   # Route 10% traffic to green
   kubectl set traffic vitingo-crm --green=10 --blue=90
   
   # Monitor for 1 hour
   # If OK, increase to 50%
   kubectl set traffic vitingo-crm --green=50 --blue=50
   
   # Monitor for 2 hours
   # If OK, full switch
   kubectl set traffic vitingo-crm --green=100 --blue=0
   ```

4. **Rollback (if needed)**
   ```bash
   # Instant rollback to blue
   kubectl set traffic vitingo-crm --green=0 --blue=100
   ```

### 9.2 Database Migration Safety

**Safe Migration Pattern:**

```python
# Migration script structure
class Migration:
    def up(self):
        """Apply migration"""
        pass
    
    def down(self):
        """Rollback migration"""
        pass
    
    def validate(self):
        """Validate migration was successful"""
        pass

# Example:
class Migration001_CreatePlatformDB(Migration):
    def up(self):
        # Create vitingo_platform database
        # Copy data from crm_db
        pass
    
    def down(self):
        # Drop vitingo_platform (if needed)
        pass
    
    def validate(self):
        # Check data counts match
        assert source_count == target_count
```

---

## 10. RİSK ANALİZİ VE ÇÖZÜMLER

### 10.1 Yüksek Riskli Alanlar

| Risk | Olasılık | Etki | Çözüm |
|------|----------|------|-------|
| **Veri kaybı during migration** | Düşük | Yüksek | Full backup before migration, validation scripts |
| **Downtime during deployment** | Orta | Orta | Blue-green deployment, rollback plan |
| **Performance degradation** | Orta | Orta | Load testing, database indexing, caching |
| **Cross-tenant data leak** | Düşük | Kritik | Multiple security layers, extensive testing |
| **Billing integration failure** | Düşük | Yüksek | Stripe test mode, webhook retry mechanism |

### 10.2 Mitigation Strategies

**1. Veri Kaybını Önleme:**
```bash
# Automated backup before every migration
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mongodump --out=/backup/pre-migration-$TIMESTAMP
echo "Backup completed: /backup/pre-migration-$TIMESTAMP"
```

**2. Performance Monitoring:**
```python
# Prometheus metrics
from prometheus_client import Counter, Histogram

request_count = Counter("api_requests_total", "Total API requests", ["tenant", "endpoint"])
request_duration = Histogram("api_request_duration_seconds", "Request duration", ["tenant", "endpoint"])

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    tenant_slug = extract_tenant_slug(request)
    
    with request_duration.labels(tenant_slug, request.url.path).time():
        response = await call_next(request)
    
    request_count.labels(tenant_slug, request.url.path).inc()
    return response
```

**3. Automated Testing Pipeline:**
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run unit tests
        run: pytest tests/unit/
      - name: Run integration tests
        run: pytest tests/integration/
      - name: Run security tests
        run: python tests/security/test_tenant_isolation.py
```

---

## 11. SONUÇ VE ÖNERİLER

### 11.1 Özet

Bu plan, mevcut **single-tenant CRM** sistemini **multi-tenant SaaS** platformuna dönüştürmek için kapsamlı bir yol haritası sunmaktadır.

**Anahtar Kararlar:**
- ✅ **Database-per-Tenant** stratejisi (güvenlik ve izolasyon)
- ✅ **Blue-Green Deployment** (sıfır kesinti)
- ✅ **Gradual Migration** (3 hafta)
- ✅ **Stripe Integration** (subscription yönetimi)

### 11.2 Başarı Kriterleri

1. ✅ **Tenant İzolasyonu:** Cross-tenant veri erişimi mümkün değil
2. ✅ **Sıfır Veri Kaybı:** Tüm veriler başarıyla migrate edildi
3. ✅ **Performance:** Response time < 200ms (95th percentile)
4. ✅ **Uptime:** %99.9 (maksimum 43 dakika downtime/ay)
5. ✅ **Security:** Tüm OWASP Top 10 testleri geçildi

### 11.3 Bir Sonraki Adımlar

**Hemen Yapılabilecekler:**
1. ⏳ Tüm database'leri backup al
2. ⏳ Test ortamında Phase 1'i başlat
3. ⏳ Stripe hesabı oluştur ve test mode'da dene
4. ⏳ Super Admin UI mockup'ları hazırla

**1 Hafta İçinde:**
1. Platform database'i oluştur (Phase 1)
2. İlk tenant (quattro-stand) oluştur (Phase 2)
3. Veri migrasyonu tamamla (Phase 3)

**2-3 Hafta İçinde:**
1. Backend refactoring (Phase 4)
2. Frontend güncellemeleri (Phase 5)
3. Kapsamlı test (Phase 6)
4. Production deployment (Phase 7)

---

## 12. EKLER

### Ek A: Tam Migration Script

```python
# /app/backend/migrations/full_migration.py
# Bu script tüm migration'ları sırayla çalıştırır

async def run_full_migration():
    print("🚀 Starting full migration to multi-tenant architecture...")
    
    # Phase 1
    print("\n📦 PHASE 1: Creating platform database...")
    await migration_001_create_platform_db()
    
    # Phase 2
    print("\n👤 PHASE 2: Creating first tenant...")
    await migration_002_create_first_tenant()
    
    # Phase 3
    print("\n📊 PHASE 3: Migrating data...")
    await migration_003_migrate_tenant_data()
    
    # Validation
    print("\n✅ VALIDATION: Checking data integrity...")
    if await validate_all_migrations():
        print("🎉 Migration completed successfully!")
    else:
        print("❌ Migration validation failed!")
        await rollback_all_migrations()
```

### Ek B: Stripe Integration Code

```python
# /app/backend/integrations/stripe_client.py

import stripe
from fastapi import HTTPException

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class StripeService:
    async def create_customer(self, tenant: dict):
        """Create Stripe customer for tenant"""
        customer = stripe.Customer.create(
            email=tenant["owner"]["email"],
            name=tenant["name"],
            metadata={"tenant_id": tenant["id"]}
        )
        return customer
    
    async def create_subscription(self, customer_id: str, price_id: str):
        """Create subscription"""
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": price_id}],
            trial_period_days=14
        )
        return subscription
```

### Ek C: Monitoring Dashboard

```python
# /app/backend/routes/admin/metrics.py

@router.get("/api/admin/metrics")
async def platform_metrics():
    """Platform health metrics"""
    
    platform_db = client["vitingo_platform"]
    
    # Tenant metrics
    total_tenants = await platform_db.tenants.count_documents({})
    active_tenants = await platform_db.tenants.count_documents({"status": "active"})
    trial_tenants = await platform_db.tenants.count_documents({"subscription.status": "trial"})
    
    # Revenue metrics
    mrr = await calculate_monthly_recurring_revenue()
    
    # Usage metrics
    api_requests_today = await get_api_request_count_today()
    
    return {
        "tenants": {
            "total": total_tenants,
            "active": active_tenants,
            "trial": trial_tenants
        },
        "revenue": {
            "mrr": mrr,
            "currency": "TRY"
        },
        "usage": {
            "api_requests_today": api_requests_today
        }
    }
```

---

**Doküman Sonu**

**Hazırlayan:** E1 AI Agent  
**Tarih:** 7 Aralık 2025  
**Versiyon:** 1.0  
**Durum:** ✅ Onay Bekliyor
