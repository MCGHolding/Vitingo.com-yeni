from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

router = APIRouter()

@router.get("/categories")
async def get_categories():
    """Get advance categories"""
    return {
        "categories": [
            {
                "id": "1",
                "name": "Yol Masrafı",
                "description": "İş seyahati yol giderleri",
                "max_amount": 10000,
                "currency": "TRY",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "id": "2",
                "name": "Konaklama",
                "description": "Otel ve konaklama giderleri",
                "max_amount": 15000,
                "currency": "TRY",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "id": "3",
                "name": "Yemek",
                "description": "İş yemeği giderleri",
                "max_amount": 5000,
                "currency": "TRY",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "id": "4",
                "name": "Ulaşım",
                "description": "Şehir içi ulaşım giderleri",
                "max_amount": 3000,
                "currency": "TRY",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "id": "5",
                "name": "Diğer",
                "description": "Diğer iş giderleri",
                "max_amount": 8000,
                "currency": "TRY",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
    }

@router.post("/categories")
async def create_category(category_data: Dict[str, Any]):
    """Create new category"""
    return {
        "success": True,
        "message": "Kategori başarıyla oluşturuldu",
        "category": {
            "id": "6",
            **category_data,
            "created_at": "2024-12-04T00:00:00Z"
        }
    }

@router.put("/categories/{category_id}")
async def update_category(category_id: str, category_data: Dict[str, Any]):
    """Update category"""
    return {
        "success": True,
        "message": "Kategori başarıyla güncellendi",
        "category": {
            "id": category_id,
            **category_data
        }
    }

@router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Delete category"""
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
