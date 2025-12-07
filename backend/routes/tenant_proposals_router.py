"""
Tenant-Aware Proposals Router
Multi-tenant proposals endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/proposals")
async def get_proposals(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    limit: int = 100
):
    """
    Get proposals for specific tenant
    
    Query params:
        - status: Filter by status (draft, sent, accepted, rejected)
        - customer_id: Filter by customer
        - limit: Maximum number of proposals
    """
    try:
        query = {}
        if status:
            query["status"] = status
        if customer_id:
            query["customerId"] = customer_id
        
        proposals = await tenant_db.proposals.find(
            query,
            {"_id": 0}
        ).sort("createdAt", -1).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(proposals),
            "data": proposals
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching proposals: {str(e)}"
        )


@router.get("/api/{tenant_slug}/proposals/{proposal_id}")
async def get_proposal_by_id(
    tenant_slug: str,
    proposal_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single proposal by ID
    """
    try:
        proposal = await tenant_db.proposals.find_one(
            {"id": proposal_id},
            {"_id": 0}
        )
        
        if not proposal:
            raise HTTPException(
                status_code=404,
                detail=f"Proposal not found: {proposal_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": proposal
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching proposal: {str(e)}"
        )


@router.post("/api/{tenant_slug}/proposals")
async def create_proposal(
    tenant_slug: str,
    proposal_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new proposal
    """
    try:
        # Add timestamps
        proposal_data["createdAt"] = datetime.utcnow()
        proposal_data["updatedAt"] = datetime.utcnow()
        proposal_data["status"] = proposal_data.get("status", "draft")
        
        result = await tenant_db.proposals.insert_one(proposal_data)
        
        # Fetch the created proposal
        created_proposal = await tenant_db.proposals.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_proposal
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating proposal: {str(e)}"
        )


@router.put("/api/{tenant_slug}/proposals/{proposal_id}")
async def update_proposal(
    tenant_slug: str,
    proposal_id: str,
    proposal_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update existing proposal
    """
    try:
        # Add update timestamp
        proposal_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.proposals.update_one(
            {"id": proposal_id},
            {"$set": proposal_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Proposal not found: {proposal_id}"
            )
        
        # Fetch updated proposal
        updated_proposal = await tenant_db.proposals.find_one(
            {"id": proposal_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_proposal
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating proposal: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/proposals/{proposal_id}")
async def delete_proposal(
    tenant_slug: str,
    proposal_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete proposal
    """
    try:
        result = await tenant_db.proposals.delete_one(
            {"id": proposal_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Proposal not found: {proposal_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Proposal {proposal_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting proposal: {str(e)}"
        )
