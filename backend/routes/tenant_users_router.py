"""
Tenant-Aware Users Router
Multi-tenant user management endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info, get_platform_db

router = APIRouter()


@router.get("/api/{tenant_slug}/users")
async def get_tenant_users(
    tenant_slug: str,
    tenant: dict = Depends(get_tenant_info),
    platform_db: AsyncIOMotorDatabase = Depends(get_platform_db),
    role: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100
):
    """
    Get users for specific tenant (from platform database)
    
    Query params:
        - role: Filter by role (admin, user, manager)
        - status: Filter by status (active, inactive)
        - limit: Maximum number of users
    """
    try:
        query = {"tenant_id": tenant["id"]}
        if role:
            query["role"] = role
        if status:
            query["status"] = status
        
        users = await platform_db.users.find(
            query,
            {"_id": 0, "password": 0}  # Exclude password
        ).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(users),
            "data": users
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching users: {str(e)}"
        )


@router.get("/api/{tenant_slug}/users/{user_id}")
async def get_user_by_id(
    tenant_slug: str,
    user_id: str,
    tenant: dict = Depends(get_tenant_info),
    platform_db: AsyncIOMotorDatabase = Depends(get_platform_db)
):
    """
    Get single user by ID
    """
    try:
        user = await platform_db.users.find_one(
            {"id": user_id, "tenant_id": tenant["id"]},
            {"_id": 0, "password": 0}
        )
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"User not found: {user_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching user: {str(e)}"
        )


@router.post("/api/{tenant_slug}/users")
async def create_user(
    tenant_slug: str,
    user_data: dict,
    tenant: dict = Depends(get_tenant_info),
    platform_db: AsyncIOMotorDatabase = Depends(get_platform_db)
):
    """
    Create new user for tenant
    """
    try:
        # Ensure user is created for this tenant
        user_data["tenant_id"] = tenant["id"]
        user_data["createdAt"] = datetime.utcnow()
        user_data["updatedAt"] = datetime.utcnow()
        user_data["status"] = user_data.get("status", "active")
        user_data["role"] = user_data.get("role", "user")
        
        # Check if email already exists for this tenant
        existing_user = await platform_db.users.find_one({
            "email": user_data.get("email"),
            "tenant_id": tenant["id"]
        })
        
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists for this tenant"
            )
        
        result = await platform_db.users.insert_one(user_data)
        
        # Fetch the created user (without password)
        created_user = await platform_db.users.find_one(
            {"_id": result.inserted_id},
            {"_id": 0, "password": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating user: {str(e)}"
        )


@router.put("/api/{tenant_slug}/users/{user_id}")
async def update_user(
    tenant_slug: str,
    user_id: str,
    user_data: dict,
    tenant: dict = Depends(get_tenant_info),
    platform_db: AsyncIOMotorDatabase = Depends(get_platform_db)
):
    """
    Update existing user
    """
    try:
        # Add update timestamp
        user_data["updatedAt"] = datetime.utcnow()
        
        # Don't allow changing tenant_id
        if "tenant_id" in user_data:
            del user_data["tenant_id"]
        
        result = await platform_db.users.update_one(
            {"id": user_id, "tenant_id": tenant["id"]},
            {"$set": user_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"User not found: {user_id}"
            )
        
        # Fetch updated user
        updated_user = await platform_db.users.find_one(
            {"id": user_id},
            {"_id": 0, "password": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating user: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/users/{user_id}")
async def delete_user(
    tenant_slug: str,
    user_id: str,
    tenant: dict = Depends(get_tenant_info),
    platform_db: AsyncIOMotorDatabase = Depends(get_platform_db)
):
    """
    Delete user
    """
    try:
        result = await platform_db.users.delete_one(
            {"id": user_id, "tenant_id": tenant["id"]}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"User not found: {user_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"User {user_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting user: {str(e)}"
        )


@router.patch("/api/{tenant_slug}/users/{user_id}/status")
async def update_user_status(
    tenant_slug: str,
    user_id: str,
    status_data: dict,
    tenant: dict = Depends(get_tenant_info),
    platform_db: AsyncIOMotorDatabase = Depends(get_platform_db)
):
    """
    Update user status (activate/deactivate)
    """
    try:
        new_status = status_data.get("status")
        if not new_status:
            raise HTTPException(status_code=400, detail="Status is required")
        
        result = await platform_db.users.update_one(
            {"id": user_id, "tenant_id": tenant["id"]},
            {"$set": {"status": new_status, "updatedAt": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"User not found: {user_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"User status updated to {new_status}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating user status: {str(e)}"
        )
