"""
Tenant-Aware Banks Router
Multi-tenant bank accounts endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/banks")
async def get_banks(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    status: Optional[str] = None,
    currency: Optional[str] = None,
    limit: int = 100
):
    """
    Get bank accounts for specific tenant
    
    Query params:
        - status: Filter by status (active, inactive)
        - currency: Filter by currency
        - limit: Maximum number of banks
    """
    try:
        query = {}
        if status:
            query["status"] = status
        if currency:
            query["currency"] = currency
        
        banks = await tenant_db.banks.find(
            query,
            {"_id": 0}
        ).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(banks),
            "data": banks
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching banks: {str(e)}"
        )


@router.get("/api/{tenant_slug}/banks/{bank_id}")
async def get_bank_by_id(
    tenant_slug: str,
    bank_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single bank account by ID
    """
    try:
        bank = await tenant_db.banks.find_one(
            {"id": bank_id},
            {"_id": 0}
        )
        
        if not bank:
            raise HTTPException(
                status_code=404,
                detail=f"Bank account not found: {bank_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": bank
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching bank: {str(e)}"
        )


@router.post("/api/{tenant_slug}/banks")
async def create_bank(
    tenant_slug: str,
    bank_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new bank account
    """
    try:
        # Add timestamps
        bank_data["createdAt"] = datetime.utcnow()
        bank_data["updatedAt"] = datetime.utcnow()
        bank_data["status"] = bank_data.get("status", "active")
        
        result = await tenant_db.banks.insert_one(bank_data)
        
        # Fetch the created bank
        created_bank = await tenant_db.banks.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_bank
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating bank: {str(e)}"
        )


@router.put("/api/{tenant_slug}/banks/{bank_id}")
async def update_bank(
    tenant_slug: str,
    bank_id: str,
    bank_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update existing bank account
    """
    try:
        # Add update timestamp
        bank_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.banks.update_one(
            {"id": bank_id},
            {"$set": bank_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Bank account not found: {bank_id}"
            )
        
        # Fetch updated bank
        updated_bank = await tenant_db.banks.find_one(
            {"id": bank_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_bank
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating bank: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/banks/{bank_id}")
async def delete_bank(
    tenant_slug: str,
    bank_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete bank account
    """
    try:
        result = await tenant_db.banks.delete_one(
            {"id": bank_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Bank account not found: {bank_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Bank account {bank_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting bank: {str(e)}"
        )
