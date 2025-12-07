"""
Tenant-Aware Fairs Router
Multi-tenant fairs/exhibitions endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/fairs")
async def get_fairs(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    status: Optional[str] = None,
    year: Optional[int] = None,
    limit: int = 100
):
    """
    Get fairs for specific tenant
    
    Query params:
        - status: Filter by status (planning, active, completed, cancelled)
        - year: Filter by year
        - limit: Maximum number of fairs
    """
    try:
        query = {}
        if status:
            query["status"] = status
        if year:
            query["year"] = year
        
        fairs = await tenant_db.fairs.find(
            query,
            {"_id": 0}
        ).sort("startDate", -1).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(fairs),
            "data": fairs
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching fairs: {str(e)}"
        )


@router.get("/api/{tenant_slug}/fairs/{fair_id}")
async def get_fair_by_id(
    tenant_slug: str,
    fair_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single fair by ID
    """
    try:
        fair = await tenant_db.fairs.find_one(
            {"id": fair_id},
            {"_id": 0}
        )
        
        if not fair:
            raise HTTPException(
                status_code=404,
                detail=f"Fair not found: {fair_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": fair
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching fair: {str(e)}"
        )


@router.post("/api/{tenant_slug}/fairs")
async def create_fair(
    tenant_slug: str,
    fair_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new fair
    """
    try:
        # Add timestamps
        fair_data["createdAt"] = datetime.utcnow()
        fair_data["updatedAt"] = datetime.utcnow()
        fair_data["status"] = fair_data.get("status", "planning")
        
        result = await tenant_db.fairs.insert_one(fair_data)
        
        # Fetch the created fair
        created_fair = await tenant_db.fairs.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_fair
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating fair: {str(e)}"
        )


@router.put("/api/{tenant_slug}/fairs/{fair_id}")
async def update_fair(
    tenant_slug: str,
    fair_id: str,
    fair_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update existing fair
    """
    try:
        # Add update timestamp
        fair_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.fairs.update_one(
            {"id": fair_id},
            {"$set": fair_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Fair not found: {fair_id}"
            )
        
        # Fetch updated fair
        updated_fair = await tenant_db.fairs.find_one(
            {"id": fair_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_fair
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating fair: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/fairs/{fair_id}")
async def delete_fair(
    tenant_slug: str,
    fair_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete fair
    """
    try:
        result = await tenant_db.fairs.delete_one(
            {"id": fair_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Fair not found: {fair_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Fair {fair_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting fair: {str(e)}"
        )
