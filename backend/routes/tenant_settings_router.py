"""
Tenant-Aware Settings Router
Multi-tenant settings endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/settings")
async def get_settings(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get all settings for specific tenant
    """
    try:
        settings = await tenant_db.settings.find(
            {},
            {"_id": 0}
        ).to_list(None)
        
        # Convert to dictionary format
        settings_dict = {}
        for setting in settings:
            settings_dict[setting.get("key")] = setting.get("value")
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": settings_dict
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching settings: {str(e)}"
        )


@router.get("/api/{tenant_slug}/settings/{key}")
async def get_setting_by_key(
    tenant_slug: str,
    key: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single setting by key
    """
    try:
        setting = await tenant_db.settings.find_one(
            {"key": key},
            {"_id": 0}
        )
        
        if not setting:
            raise HTTPException(
                status_code=404,
                detail=f"Setting not found: {key}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": setting
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching setting: {str(e)}"
        )


@router.put("/api/{tenant_slug}/settings/{key}")
async def update_setting(
    tenant_slug: str,
    key: str,
    setting_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update or create setting
    """
    try:
        # Add/update timestamps
        setting_data["key"] = key
        setting_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.settings.update_one(
            {"key": key},
            {"$set": setting_data, "$setOnInsert": {"createdAt": datetime.utcnow()}},
            upsert=True
        )
        
        # Fetch updated setting
        updated_setting = await tenant_db.settings.find_one(
            {"key": key},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_setting
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating setting: {str(e)}"
        )


@router.post("/api/{tenant_slug}/settings/bulk")
async def update_settings_bulk(
    tenant_slug: str,
    settings_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update multiple settings at once
    """
    try:
        updated_count = 0
        
        for key, value in settings_data.items():
            result = await tenant_db.settings.update_one(
                {"key": key},
                {
                    "$set": {
                        "key": key,
                        "value": value,
                        "updatedAt": datetime.utcnow()
                    },
                    "$setOnInsert": {"createdAt": datetime.utcnow()}
                },
                upsert=True
            )
            if result.matched_count > 0 or result.upserted_id:
                updated_count += 1
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Updated {updated_count} settings"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating settings: {str(e)}"
        )
