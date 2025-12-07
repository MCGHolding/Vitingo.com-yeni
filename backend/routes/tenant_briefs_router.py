"""
Tenant-Aware Briefs Router
Multi-tenant project briefs endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/briefs")
async def get_briefs(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100
):
    """
    Get briefs for specific tenant
    
    Query params:
        - project_id: Filter by project
        - status: Filter by status (draft, finalized)
        - limit: Maximum number of briefs
    """
    try:
        query = {}
        if project_id:
            query["projectId"] = project_id
        if status:
            query["status"] = status
        
        briefs = await tenant_db.briefs.find(
            query,
            {"_id": 0}
        ).sort("createdAt", -1).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(briefs),
            "data": briefs
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching briefs: {str(e)}"
        )


@router.get("/api/{tenant_slug}/briefs/{brief_id}")
async def get_brief_by_id(
    tenant_slug: str,
    brief_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single brief by ID
    """
    try:
        brief = await tenant_db.briefs.find_one(
            {"id": brief_id},
            {"_id": 0}
        )
        
        if not brief:
            raise HTTPException(
                status_code=404,
                detail=f"Brief not found: {brief_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": brief
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching brief: {str(e)}"
        )


@router.post("/api/{tenant_slug}/briefs")
async def create_brief(
    tenant_slug: str,
    brief_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new brief
    """
    try:
        # Add timestamps
        brief_data["createdAt"] = datetime.utcnow()
        brief_data["updatedAt"] = datetime.utcnow()
        brief_data["status"] = brief_data.get("status", "draft")
        
        result = await tenant_db.briefs.insert_one(brief_data)
        
        # Fetch the created brief
        created_brief = await tenant_db.briefs.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_brief
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating brief: {str(e)}"
        )


@router.put("/api/{tenant_slug}/briefs/{brief_id}")
async def update_brief(
    tenant_slug: str,
    brief_id: str,
    brief_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update existing brief
    """
    try:
        # Add update timestamp
        brief_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.briefs.update_one(
            {"id": brief_id},
            {"$set": brief_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Brief not found: {brief_id}"
            )
        
        # Fetch updated brief
        updated_brief = await tenant_db.briefs.find_one(
            {"id": brief_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_brief
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating brief: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/briefs/{brief_id}")
async def delete_brief(
    tenant_slug: str,
    brief_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete brief
    """
    try:
        result = await tenant_db.briefs.delete_one(
            {"id": brief_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Brief not found: {brief_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Brief {brief_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting brief: {str(e)}"
        )
