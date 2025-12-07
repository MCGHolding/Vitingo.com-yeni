"""
Tenant-Aware Projects Router
Multi-tenant projects endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/projects")
async def get_projects(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    limit: int = 100
):
    """
    Get projects for specific tenant
    
    Query params:
        - status: Filter by status
        - customer_id: Filter by customer
        - limit: Maximum number of projects
    """
    try:
        query = {}
        if status:
            query["status"] = status
        if customer_id:
            query["customerId"] = customer_id
        
        projects = await tenant_db.projects.find(
            query,
            {"_id": 0}
        ).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(projects),
            "data": projects
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching projects: {str(e)}"
        )


@router.get("/api/{tenant_slug}/projects/{project_id}")
async def get_project_by_id(
    tenant_slug: str,
    project_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single project by ID
    """
    try:
        project = await tenant_db.projects.find_one(
            {"projectNumber": project_id},
            {"_id": 0}
        )
        
        if not project:
            raise HTTPException(
                status_code=404,
                detail=f"Project not found: {project_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": project
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching project: {str(e)}"
        )


@router.post("/api/{tenant_slug}/projects")
async def create_project(
    tenant_slug: str,
    project_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new project
    """
    try:
        # Add timestamps
        project_data["createdAt"] = datetime.utcnow()
        project_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.projects.insert_one(project_data)
        
        # Fetch the created project
        created_project = await tenant_db.projects.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_project
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating project: {str(e)}"
        )


@router.put("/api/{tenant_slug}/projects/{project_id}")
async def update_project(
    tenant_slug: str,
    project_id: str,
    project_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update existing project
    """
    try:
        # Add update timestamp
        project_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.projects.update_one(
            {"projectNumber": project_id},
            {"$set": project_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Project not found: {project_id}"
            )
        
        # Fetch updated project
        updated_project = await tenant_db.projects.find_one(
            {"projectNumber": project_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_project
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating project: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/projects/{project_id}")
async def delete_project(
    tenant_slug: str,
    project_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete project
    """
    try:
        result = await tenant_db.projects.delete_one(
            {"projectNumber": project_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Project not found: {project_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Project {project_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting project: {str(e)}"
        )
