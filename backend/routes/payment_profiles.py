from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client['crm_db']

# Pydantic Models
class PaymentItem(BaseModel):
    order: int = Field(..., ge=1)
    percentage: int = Field(..., ge=1, le=100)
    dueType: str = Field(..., pattern="^(contract_date|setup_start|event_delivery|after_delivery|custom)$")
    dueDays: Optional[int] = Field(None, ge=0, le=365)

class PaymentProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = ""
    isDefault: bool = False
    payments: List[PaymentItem]

class PaymentProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    isDefault: Optional[bool] = None
    payments: Optional[List[PaymentItem]] = None
    isActive: Optional[bool] = None

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
        if 'createdBy' in doc and doc['createdBy']:
            doc['createdBy'] = str(doc['createdBy'])
    return doc

@router.get("/api/payment-profiles")
async def get_payment_profiles(active_only: bool = True):
    """Get all payment profiles"""
    try:
        query = {"isActive": True} if active_only else {}
        profiles = await db.payment_profiles.find(query, {"_id": 0}).to_list(1000)
        return profiles
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payment profiles: {str(e)}")

@router.get("/api/payment-profiles/{profile_id}")
async def get_payment_profile(profile_id: str):
    """Get a single payment profile by ID"""
    try:
        if not ObjectId.is_valid(profile_id):
            raise HTTPException(status_code=400, detail="Invalid profile ID")
        
        profile = await db.payment_profiles.find_one({"_id": ObjectId(profile_id)}, {"_id": 0})
        if not profile:
            raise HTTPException(status_code=404, detail="Payment profile not found")
        
        return serialize_doc(profile)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payment profile: {str(e)}")

@router.post("/api/payment-profiles")
async def create_payment_profile(data: PaymentProfileCreate):
    """Create a new payment profile"""
    try:
        # Validate: Total percentage must be 100
        total_percentage = sum(p.percentage for p in data.payments)
        if total_percentage != 100:
            raise HTTPException(
                status_code=400,
                detail=f"Toplam yüzde %100 olmalı, şu an: %{total_percentage}"
            )
        
        # Validate: dueType that needs dueDays must have it
        for payment in data.payments:
            if payment.dueType in ['after_delivery', 'custom'] and not payment.dueDays:
                raise HTTPException(
                    status_code=400,
                    detail=f"'{payment.dueType}' vade tipi için gün sayısı girilmelidir"
                )
        
        profile = {
            "name": data.name,
            "description": data.description,
            "isDefault": data.isDefault,
            "isActive": True,
            "payments": [p.dict() for p in data.payments],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        # If isDefault=True, set all other profiles' isDefault to False
        if profile["isDefault"]:
            await db.payment_profiles.update_many(
                {"isDefault": True},
                {"$set": {"isDefault": False, "updatedAt": datetime.utcnow()}}
            )
        
        result = await db.payment_profiles.insert_one(profile)
        
        return {
            "_id": str(result.inserted_id),
            "success": True,
            "message": "Ödeme profili başarıyla oluşturuldu"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating payment profile: {str(e)}")

@router.put("/api/payment-profiles/{profile_id}")
async def update_payment_profile(profile_id: str, data: PaymentProfileUpdate):
    """Update an existing payment profile"""
    try:
        if not ObjectId.is_valid(profile_id):
            raise HTTPException(status_code=400, detail="Invalid profile ID")
        
        # Check if profile exists
        existing = await db.payment_profiles.find_one({"_id": ObjectId(profile_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Payment profile not found")
        
        update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
        
        # Validate payments if provided
        if "payments" in update_data:
            total_percentage = sum(p['percentage'] for p in update_data['payments'])
            if total_percentage != 100:
                raise HTTPException(
                    status_code=400,
                    detail=f"Toplam yüzde %100 olmalı, şu an: %{total_percentage}"
                )
            
            for payment in update_data['payments']:
                if payment['dueType'] in ['after_delivery', 'custom'] and not payment.get('dueDays'):
                    raise HTTPException(
                        status_code=400,
                        detail=f"'{payment['dueType']}' vade tipi için gün sayısı girilmelidir"
                    )
        
        # If setting as default, unset other defaults
        if update_data.get("isDefault") is True:
            await db.payment_profiles.update_many(
                {"_id": {"$ne": ObjectId(profile_id)}, "isDefault": True},
                {"$set": {"isDefault": False, "updatedAt": datetime.utcnow()}}
            )
        
        update_data["updatedAt"] = datetime.utcnow()
        
        await db.payment_profiles.update_one(
            {"_id": ObjectId(profile_id)},
            {"$set": update_data}
        )
        
        return {"success": True, "message": "Ödeme profili güncellendi"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating payment profile: {str(e)}")

@router.delete("/api/payment-profiles/{profile_id}")
async def delete_payment_profile(profile_id: str, hard_delete: bool = False):
    """Delete (soft delete) a payment profile"""
    try:
        if not ObjectId.is_valid(profile_id):
            raise HTTPException(status_code=400, detail="Invalid profile ID")
        
        # Check if profile exists
        existing = await db.payment_profiles.find_one({"_id": ObjectId(profile_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Payment profile not found")
        
        if hard_delete:
            await db.payment_profiles.delete_one({"_id": ObjectId(profile_id)})
        else:
            # Soft delete
            await db.payment_profiles.update_one(
                {"_id": ObjectId(profile_id)},
                {"$set": {"isActive": False, "updatedAt": datetime.utcnow()}}
            )
        
        return {"success": True, "message": "Ödeme profili silindi"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting payment profile: {str(e)}")
