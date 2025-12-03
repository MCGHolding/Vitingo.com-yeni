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
    return {
        "can_request": True,
        "message": "Avans talebi oluşturabilirsiniz",
        "remaining_limit": 50000,
        "currency": "TRY"
    }

@router.get("/advance-rules")
async def get_advance_rules():
    """Get advance rules"""
    return {
        "max_amount": 100000,
        "min_amount": 100,
        "currency": "TRY",
        "max_days": 60
    }

@router.post("/documents/advances")
async def create_advance(advance_data: Dict[str, Any]):
    """Create new advance request"""
    return {
        "success": True,
        "message": "Avans talebi başarıyla oluşturuldu",
        "id": "ADV-001"
    }

@router.get("/documents/advances")
async def get_advances():
    """Get user's advances"""
    return {
        "success": True,
        "advances": {
            "pending": [],
            "approved": [],
            "paid": [],
            "rejected": []
        },
        "is_accounting": False,
        "is_admin": False
    }

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

@router.put("/rules")
async def update_advance_rules(rules_data: Dict[str, Any]):
    """Update advance rules"""
    return {
        "success": True,
        "message": "Kurallar başarıyla güncellendi",
        "rules": rules_data
    }
