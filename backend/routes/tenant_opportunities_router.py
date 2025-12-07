"""
Tenant-Aware Opportunities Router
Multi-tenant opportunities/sales pipeline endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/opportunities")
async def get_opportunities(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    stage: Optional[str] = None,
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    limit: int = 100
):
    """
    Get opportunities for specific tenant
    
    Query params:
        - stage: Filter by pipeline stage (lead, qualified, proposal, negotiation, closed)
        - status: Filter by status (open, won, lost)
        - customer_id: Filter by customer
        - limit: Maximum number of opportunities
    """
    try:
        query = {}
        if stage:
            query["stage"] = stage
        if status:
            query["status"] = status
        if customer_id:
            query["customerId"] = customer_id
        
        opportunities = await tenant_db.opportunities.find(
            query,
            {"_id": 0}
        ).sort("createdAt", -1).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(opportunities),
            "data": opportunities
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching opportunities: {str(e)}"
        )


@router.get("/api/{tenant_slug}/opportunities/{opportunity_id}")
async def get_opportunity_by_id(
    tenant_slug: str,
    opportunity_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single opportunity by ID
    """
    try:
        opportunity = await tenant_db.opportunities.find_one(
            {"id": opportunity_id},
            {"_id": 0}
        )
        
        if not opportunity:
            raise HTTPException(
                status_code=404,
                detail=f"Opportunity not found: {opportunity_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": opportunity
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching opportunity: {str(e)}"
        )


@router.post("/api/{tenant_slug}/opportunities")
async def create_opportunity(
    tenant_slug: str,
    opportunity_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new opportunity
    """
    try:
        # Add timestamps
        opportunity_data["createdAt"] = datetime.utcnow()
        opportunity_data["updatedAt"] = datetime.utcnow()
        opportunity_data["status"] = opportunity_data.get("status", "open")
        opportunity_data["stage"] = opportunity_data.get("stage", "lead")
        
        result = await tenant_db.opportunities.insert_one(opportunity_data)
        
        # Fetch the created opportunity
        created_opportunity = await tenant_db.opportunities.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_opportunity
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating opportunity: {str(e)}"
        )


@router.put("/api/{tenant_slug}/opportunities/{opportunity_id}")
async def update_opportunity(
    tenant_slug: str,
    opportunity_id: str,
    opportunity_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update existing opportunity
    """
    try:
        # Add update timestamp
        opportunity_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.opportunities.update_one(
            {"id": opportunity_id},
            {"$set": opportunity_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Opportunity not found: {opportunity_id}"
            )
        
        # Fetch updated opportunity
        updated_opportunity = await tenant_db.opportunities.find_one(
            {"id": opportunity_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_opportunity
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating opportunity: {str(e)}"
        )


@router.patch("/api/{tenant_slug}/opportunities/{opportunity_id}/stage")
async def update_opportunity_stage(
    tenant_slug: str,
    opportunity_id: str,
    stage_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update opportunity stage (move in pipeline)
    """
    try:
        new_stage = stage_data.get("stage")
        if not new_stage:
            raise HTTPException(status_code=400, detail="Stage is required")
        
        result = await tenant_db.opportunities.update_one(
            {"id": opportunity_id},
            {"$set": {"stage": new_stage, "updatedAt": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Opportunity not found: {opportunity_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Opportunity stage updated to {new_stage}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating opportunity stage: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/opportunities/{opportunity_id}")
async def delete_opportunity(
    tenant_slug: str,
    opportunity_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete opportunity
    """
    try:
        result = await tenant_db.opportunities.delete_one(
            {"id": opportunity_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Opportunity not found: {opportunity_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Opportunity {opportunity_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting opportunity: {str(e)}"
        )


@router.get("/api/{tenant_slug}/opportunities/pipeline/stats")
async def get_pipeline_stats(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get pipeline statistics (opportunities by stage)
    """
    try:
        pipeline = [
            {
                "$group": {
                    "_id": "$stage",
                    "count": {"$sum": 1},
                    "totalValue": {"$sum": "$value"}
                }
            }
        ]
        
        stats = await tenant_db.opportunities.aggregate(pipeline).to_list(None)
        
        # Format stats
        stats_dict = {}
        for stat in stats:
            stats_dict[stat["_id"]] = {
                "count": stat["count"],
                "totalValue": stat.get("totalValue", 0)
            }
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "pipelineStats": stats_dict
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching pipeline stats: {str(e)}"
        )
