"""
Tenant-Aware Tasks Router
Multi-tenant tasks endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/tasks")
async def get_tasks(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    limit: int = 100
):
    """
    Get tasks for specific tenant
    
    Query params:
        - status: Filter by status
        - assigned_to: Filter by assigned user
        - limit: Maximum number of tasks
    """
    try:
        query = {}
        if status:
            query["status"] = status
        if assigned_to:
            query["assigned_to"] = assigned_to
        
        tasks = await tenant_db.tasks.find(
            query,
            {"_id": 0}
        ).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(tasks),
            "data": tasks
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching tasks: {str(e)}"
        )


@router.get("/api/{tenant_slug}/tasks/{task_id}")
async def get_task_by_id(
    tenant_slug: str,
    task_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single task by ID
    """
    try:
        task = await tenant_db.tasks.find_one(
            {"id": task_id},
            {"_id": 0}
        )
        
        if not task:
            raise HTTPException(
                status_code=404,
                detail=f"Task not found: {task_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": task
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching task: {str(e)}"
        )


@router.post("/api/{tenant_slug}/tasks")
async def create_task(
    tenant_slug: str,
    task_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new task
    """
    try:
        # Add timestamps
        task_data["createdAt"] = datetime.utcnow()
        task_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.tasks.insert_one(task_data)
        
        # Fetch the created task
        created_task = await tenant_db.tasks.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_task
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating task: {str(e)}"
        )


@router.put("/api/{tenant_slug}/tasks/{task_id}")
async def update_task(
    tenant_slug: str,
    task_id: str,
    task_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update existing task
    """
    try:
        # Add update timestamp
        task_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.tasks.update_one(
            {"id": task_id},
            {"$set": task_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Task not found: {task_id}"
            )
        
        # Fetch updated task
        updated_task = await tenant_db.tasks.find_one(
            {"id": task_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_task
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating task: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/tasks/{task_id}")
async def delete_task(
    tenant_slug: str,
    task_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete task
    """
    try:
        result = await tenant_db.tasks.delete_one(
            {"id": task_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Task not found: {task_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Task {task_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting task: {str(e)}"
        )
