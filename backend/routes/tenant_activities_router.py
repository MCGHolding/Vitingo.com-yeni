"""
Tenant-Aware Activities Router
Multi-tenant activities endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/activities")
async def get_activities(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    limit: int = 100
):
    """
    Get activities for specific tenant
    
    Query params:
        - entity_type: Filter by entity type (customer, project, etc.)
        - entity_id: Filter by entity ID
        - limit: Maximum number of activities
    """
    try:
        query = {}
        if entity_type:
            query["entity_type"] = entity_type
        if entity_id:
            query["entity_id"] = entity_id
        
        activities = await tenant_db.activities.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(activities),
            "data": activities
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching activities: {str(e)}"
        )


@router.get("/api/{tenant_slug}/activities/{activity_id}")
async def get_activity_by_id(
    tenant_slug: str,
    activity_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single activity by ID
    """
    try:
        activity = await tenant_db.activities.find_one(
            {"id": activity_id},
            {"_id": 0}
        )
        
        if not activity:
            raise HTTPException(
                status_code=404,
                detail=f"Activity not found: {activity_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": activity
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching activity: {str(e)}"
        )


@router.post("/api/{tenant_slug}/activities")
async def create_activity(
    tenant_slug: str,
    activity_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new activity
    """
    try:
        # Add timestamp
        activity_data["created_at"] = datetime.utcnow()
        
        result = await tenant_db.activities.insert_one(activity_data)
        
        # Fetch the created activity
        created_activity = await tenant_db.activities.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_activity
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating activity: {str(e)}"
        )
