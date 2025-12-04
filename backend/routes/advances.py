from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
from uuid import uuid4

router = APIRouter()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.vitingo

@router.get("/categories")
async def get_categories():
    """Get advance categories"""
    categories = await db.advance_categories.find({}, {"_id": 0}).to_list(1000)
    
    # Eğer hiç kategori yoksa default'ları ekle
    if not categories:
        default_categories = [
            {
                "id": str(uuid4()),
                "name": "Yol Masrafı",
                "description": "İş seyahati yol giderleri",
                "max_amount": 10000,
                "currency": "TRY",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid4()),
                "name": "Konaklama",
                "description": "Otel ve konaklama giderleri",
                "max_amount": 15000,
                "currency": "TRY",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid4()),
                "name": "Yemek",
                "description": "İş yemeği giderleri",
                "max_amount": 5000,
                "currency": "TRY",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid4()),
                "name": "Ulaşım",
                "description": "Şehir içi ulaşım giderleri",
                "max_amount": 3000,
                "currency": "TRY",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid4()),
                "name": "Diğer",
                "description": "Diğer iş giderleri",
                "max_amount": 8000,
                "currency": "TRY",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
        ]
        await db.advance_categories.insert_many(default_categories)
        categories = default_categories
    
    return {"categories": categories}

@router.post("/categories")
async def create_category(category_data: Dict[str, Any]):
    """Create new category"""
    category_id = str(uuid4())
    new_category = {
        "id": category_id,
        "name": category_data.get("name"),
        "description": category_data.get("description", ""),
        "max_amount": category_data.get("max_amount", 0),
        "currency": category_data.get("currency", "TRY"),
        "is_active": category_data.get("is_active", True),
        "created_at": datetime.utcnow().isoformat()
    }
    
    # MongoDB'ye insert et
    await db.advance_categories.insert_one({**new_category})
    
    # Response'da _id'yi çıkar
    return {
        "success": True,
        "message": "Kategori başarıyla oluşturuldu",
        "category": new_category
    }

@router.put("/categories/{category_id}")
async def update_category(category_id: str, category_data: Dict[str, Any]):
    """Update category"""
    # Güncellenecek alanlar
    update_data = {
        "name": category_data.get("name"),
        "description": category_data.get("description"),
        "max_amount": category_data.get("max_amount"),
        "currency": category_data.get("currency", "TRY"),
        "is_active": category_data.get("is_active", True),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    result = await db.advance_categories.update_one(
        {"id": category_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    
    # Güncellenmiş kategoriyi getir
    updated_category = await db.advance_categories.find_one({"id": category_id}, {"_id": 0})
    
    return {
        "success": True,
        "message": "Kategori başarıyla güncellendi",
        "category": updated_category
    }

@router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Delete category"""
    result = await db.advance_categories.delete_one({"id": category_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    
    return {
        "success": True,
        "message": "Kategori başarıyla silindi"
    }

@router.get("/cost-centers/projects")
async def get_projects():
    """Get projects/cost centers"""
    return [
        {"id": "1", "name": "Proje A", "description": "İlk proje"},
        {"id": "2", "name": "Proje B", "description": "İkinci proje"},
        {"id": "3", "name": "Genel", "description": "Genel giderler"}
    ]

@router.get("/currencies")
async def get_currencies():
    """Get available currencies"""
    return [
        {"code": "TRY", "symbol": "₺", "name": "Türk Lirası"},
        {"code": "USD", "symbol": "$", "name": "US Dollar"},
        {"code": "EUR", "symbol": "€", "name": "Euro"}
    ]

@router.get("/company/base-currency")
async def get_base_currency():
    """Get company base currency"""
    return {"code": "TRY", "symbol": "₺", "name": "Türk Lirası"}

@router.get("/advance-eligibility")
async def get_advance_eligibility():
    """Check if user can request advance"""
    # Avans kurallarını al
    rules = await db.advance_rules.find_one({}, {"_id": 0})
    if not rules:
        rules = {
            "max_open_advances": 6,
            "max_total_amount": 300000,
            "currency": "TRY"
        }
    
    # Kullanıcının açık avanslarını say
    # TODO: Gerçek kullanıcı ID'si ile filtrele
    open_advances = await db.advances.count_documents({
        "status": {"$in": ["pending", "approved", "paid"]}
    })
    
    # Kullanıcının açık avanslarının toplam tutarını hesapla
    pipeline = [
        {"$match": {"status": {"$in": ["pending", "approved", "paid"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    result = await db.advances.aggregate(pipeline).to_list(1)
    used_amount = result[0]["total"] if result else 0
    
    max_open = rules.get("max_open_advances", 6)
    max_total = rules.get("max_total_amount", 300000)
    
    can_request = open_advances < max_open and used_amount < max_total
    
    return {
        "can_request": can_request,
        "message": "Yeni Avans Talebi Oluşturabilirsiniz" if can_request else "Avans limitiniz dolmuş",
        "open_advances": open_advances,
        "max_open_advances": max_open,
        "used_amount": used_amount,
        "max_total_amount": max_total,
        "remaining_amount": max_total - used_amount,
        "currency": rules.get("currency", "TRY")
    }

@router.get("/advance-rules")
async def get_advance_rules():
    """Get advance rules"""
    # MongoDB'den kuralları çek
    rules = await db.advance_rules.find_one({}, {"_id": 0})
    
    # Eğer yoksa default kuralları oluştur
    if not rules:
        rules = {
            "standard_days": 15,
            "medium_days": 30,
            "extended_days": 60,
            "yearly_medium_limit": 8,      # 30 günlük avansı yılda 8 kez kullanabilir
            "yearly_extended_limit": 8,    # 60 günlük avansı yılda 8 kez kullanabilir
            "max_open_advances": 3,
            "max_total_amount": 100000,
            "min_amount": 100,
            "currency": "TRY",
            "rules_enabled": True,
            "created_at": datetime.utcnow().isoformat()
        }
        await db.advance_rules.insert_one(rules)
    
    return rules

@router.post("/documents/advances")
async def create_advance(advance_data: Dict[str, Any]):
    """Create new advance request - REAL MongoDB implementation"""
    try:
        # Generate advance ID
        advance_id = str(uuid4())
        advance_number = f"ADV-{datetime.utcnow().strftime('%Y%m')}-{advance_id[:8].upper()}"
        
        # Prepare advance document
        new_advance = {
            "id": advance_id,
            "advance_number": advance_number,
            "user_id": advance_data.get("user_id", "default_user"),
            "user_name": advance_data.get("user_name", "Demo User"),
            "amount": float(advance_data.get("amount", 0)),
            "currency": advance_data.get("currency", "TRY"),
            "category_id": advance_data.get("category_id"),
            "category_name": advance_data.get("category_name", ""),
            "project_id": advance_data.get("project_id"),
            "project_name": advance_data.get("project_name", ""),
            "closure_days": int(advance_data.get("closure_days", 15)),
            "reason": advance_data.get("reason", ""),
            "status": "pending",  # pending, approved, paid, rejected, closed
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert to MongoDB
        await db.advances.insert_one(new_advance)
        
        return {
            "success": True,
            "message": "Avans talebi başarıyla oluşturuldu",
            "id": advance_id,
            "advance_number": advance_number,
            "advance": {k: v for k, v in new_advance.items() if k != "_id"}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Avans oluşturma hatası: {str(e)}")

@router.get("/documents/advances")
async def get_advances():
    """Get user's advances - REAL MongoDB implementation"""
    try:
        # Fetch all advances from MongoDB
        advances = await db.advances.find({}, {"_id": 0}).to_list(1000)
        
        # Group by status
        grouped = {
            "pending": [],
            "approved": [],
            "paid": [],
            "rejected": [],
            "closed": []
        }
        
        for advance in advances:
            status = advance.get("status", "pending")
            if status in grouped:
                grouped[status].append(advance)
        
        return {
            "success": True,
            "advances": grouped,
            "is_accounting": False,
            "is_admin": False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Avans listesi getirme hatası: {str(e)}")

@router.get("/currency-settings")
async def get_currency_settings():
    """Get user currency settings"""
    return {
        "allowed_currencies": ["TRY", "USD", "EUR"],
        "default_currency": "TRY"
    }

@router.get("/rules")
async def get_advance_rules_settings():
    """Get advance rules for settings page"""
    return {
        "rules": {
            "min_amount": 100,
            "max_amount": 100000,
            "currency": "TRY",
            "min_closure_days": 15,
            "max_closure_days": 60,
            "default_closure_days": 30,
            "allow_multiple_open_advances": False,
            "require_manager_approval": True,
            "require_finance_approval": True,
            "auto_approval_limit": 5000
        }
    }

@router.put("/advance-rules")
async def update_advance_rules(rules_data: Dict[str, Any]):
    """Update advance rules"""
    # Güncellenecek alanlar
    update_data = {
        "standard_days": rules_data.get("standard_days", 15),
        "medium_days": rules_data.get("medium_days", 30),
        "extended_days": rules_data.get("extended_days", 60),
        "yearly_medium_limit": rules_data.get("yearly_medium_limit", 8),
        "yearly_extended_limit": rules_data.get("yearly_extended_limit", 8),
        "max_open_advances": rules_data.get("max_open_advances", 3),
        "max_total_amount": rules_data.get("max_total_amount", 100000),
        "rules_enabled": rules_data.get("rules_enabled", True),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # MongoDB'de güncelle (upsert: yoksa oluştur)
    await db.advance_rules.update_one(
        {},  # İlk kuralı güncelle (tek bir kural set'i varsayıyoruz)
        {"$set": update_data},
        upsert=True
    )
    
    return {
        "success": True,
        "message": "Kurallar başarıyla güncellendi",
        "rules": update_data
    }

@router.get("/advance-usage")
async def get_advance_usage():
    """Get user's advance usage for the current year"""
    # Avans kurallarını al
    rules = await db.advance_rules.find_one({}, {"_id": 0})
    if not rules:
        return {
            "used_medium_advances": 0,
            "used_extended_advances": 0,
            "yearly_medium_limit": 8,
            "yearly_extended_limit": 8,
            "can_use_medium": True,
            "can_use_extended": True,
            "message": "Yıllık kullanım haklarınız: 8 orta süre, 8 uzun süre"
        }
    
    # Yılın başlangıcını hesapla
    current_year = datetime.utcnow().year
    year_start = datetime(current_year, 1, 1)
    
    # TODO: Gerçek kullanıcı ID'si ile filtrele
    # Kullanıcının bu yıl içinde oluşturduğu avansları say
    # 30 günlük avanslar (medium)
    medium_days = rules.get("medium_days", 30)
    used_medium = await db.advances.count_documents({
        "closure_days": medium_days,
        "created_at": {"$gte": year_start.isoformat()}
    })
    
    # 60 günlük avanslar (extended)
    extended_days = rules.get("extended_days", 60)
    used_extended = await db.advances.count_documents({
        "closure_days": extended_days,
        "created_at": {"$gte": year_start.isoformat()}
    })
    
    yearly_medium_limit = rules.get("yearly_medium_limit", 8)
    yearly_extended_limit = rules.get("yearly_extended_limit", 8)
    
    can_use_medium = used_medium < yearly_medium_limit
    can_use_extended = used_extended < yearly_extended_limit
    
    # Mesajları oluştur
    if can_use_medium:
        medium_message = f"Bu yıl {medium_days} günlük avans hakkınızı {used_medium}/{yearly_medium_limit} kez kullandınız. Kalan: {yearly_medium_limit - used_medium}"
    else:
        medium_message = f"Bu yıl {medium_days} günlük avans hakkınızı {used_medium}/{yearly_medium_limit} kez kullandınız. Limit doldu."
    
    if can_use_extended:
        extended_message = f"Bu yıl {extended_days} günlük avans hakkınızı {used_extended}/{yearly_extended_limit} kez kullandınız. Kalan: {yearly_extended_limit - used_extended}"
    else:
        extended_message = f"Bu yıl {extended_days} günlük avans hakkınızı {used_extended}/{yearly_extended_limit} kez kullandınız. Limit doldu."
    
    return {
        "used_medium_advances": used_medium,
        "used_extended_advances": used_extended,
        "yearly_medium_limit": yearly_medium_limit,
        "yearly_extended_limit": yearly_extended_limit,
        "remaining_medium": yearly_medium_limit - used_medium,
        "remaining_extended": yearly_extended_limit - used_extended,
        "can_use_medium": can_use_medium,
        "can_use_extended": can_use_extended,
        "medium_message": medium_message,
        "extended_message": extended_message,
        "message": f"Yıllık kullanım durumu: {medium_days} gün ({used_medium}/{yearly_medium_limit}), {extended_days} gün ({used_extended}/{yearly_extended_limit})"
    }

@router.post("/advance-usage/use-extended")
async def use_extended_advance():
    """Record extended advance usage (not actually needed, just for compatibility)"""
    # Bu endpoint modal'dan çağrılıyor ama aslında kayıt oluşturma endpoint'i kullanılacak
    # Şimdilik sadece success döndür
    return {
        "success": True,
        "message": "Uzun süre hakkı kullanıldı olarak işaretlendi"
    }
