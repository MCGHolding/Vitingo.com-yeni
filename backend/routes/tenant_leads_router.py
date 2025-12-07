"""
Tenant-Aware Leads Router
Multi-tenant leads endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/leads")
async def get_leads(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    status: Optional[str] = None,
    limit: int = 100
):
    """
    Get leads for specific tenant
    
    Query params:
        - status: Filter by status
        - limit: Maximum number of leads
    """
    try:
        query = {}
        if status:
            query["status"] = status
        
        leads = await tenant_db.leads.find(
            query,
            {"_id": 0}
        ).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(leads),
            "data": leads
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching leads: {str(e)}"
        )


@router.get("/api/{tenant_slug}/leads/{lead_id}")
async def get_lead_by_id(
    tenant_slug: str,
    lead_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single lead by ID
    """
    try:
        lead = await tenant_db.leads.find_one(
            {"id": lead_id},
            {"_id": 0}
        )
        
        if not lead:
            raise HTTPException(
                status_code=404,
                detail=f"Lead not found: {lead_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": lead
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching lead: {str(e)}"
        )


@router.post("/api/{tenant_slug}/leads")
async def create_lead(
    tenant_slug: str,
    lead_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new lead
    """
    try:
        # Add timestamps
        lead_data["createdAt"] = datetime.utcnow()
        lead_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.leads.insert_one(lead_data)
        
        # Fetch the created lead
        created_lead = await tenant_db.leads.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_lead
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating lead: {str(e)}"
        )


@router.put("/api/{tenant_slug}/leads/{lead_id}")
async def update_lead(
    tenant_slug: str,
    lead_id: str,
    lead_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update existing lead
    """
    try:
        # Add update timestamp
        lead_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.leads.update_one(
            {"id": lead_id},
            {"$set": lead_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Lead not found: {lead_id}"
            )
        
        # Fetch updated lead
        updated_lead = await tenant_db.leads.find_one(
            {"id": lead_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_lead
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating lead: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/leads/{lead_id}")
async def delete_lead(
    tenant_slug: str,
    lead_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete lead
    """
    try:
        result = await tenant_db.leads.delete_one(
            {"id": lead_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Lead not found: {lead_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Lead {lead_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting lead: {str(e)}"
        )
