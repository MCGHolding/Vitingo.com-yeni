"""
Tenant-Aware Contracts Router
Multi-tenant contracts endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/contracts")
async def get_contracts(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    limit: int = 100
):
    """
    Get contracts for specific tenant
    
    Query params:
        - status: Filter by status (draft, active, expired, terminated)
        - customer_id: Filter by customer
        - limit: Maximum number of contracts
    """
    try:
        query = {}
        if status:
            query["status"] = status
        if customer_id:
            query["customerId"] = customer_id
        
        contracts = await tenant_db.contracts.find(
            query,
            {"_id": 0}
        ).sort("startDate", -1).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(contracts),
            "data": contracts
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching contracts: {str(e)}"
        )


@router.get("/api/{tenant_slug}/contracts/{contract_id}")
async def get_contract_by_id(
    tenant_slug: str,
    contract_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single contract by ID
    """
    try:
        contract = await tenant_db.contracts.find_one(
            {"id": contract_id},
            {"_id": 0}
        )
        
        if not contract:
            raise HTTPException(
                status_code=404,
                detail=f"Contract not found: {contract_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": contract
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching contract: {str(e)}"
        )


@router.post("/api/{tenant_slug}/contracts")
async def create_contract(
    tenant_slug: str,
    contract_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new contract
    """
    try:
        # Add timestamps
        contract_data["createdAt"] = datetime.utcnow()
        contract_data["updatedAt"] = datetime.utcnow()
        contract_data["status"] = contract_data.get("status", "draft")
        
        result = await tenant_db.contracts.insert_one(contract_data)
        
        # Fetch the created contract
        created_contract = await tenant_db.contracts.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_contract
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating contract: {str(e)}"
        )


@router.put("/api/{tenant_slug}/contracts/{contract_id}")
async def update_contract(
    tenant_slug: str,
    contract_id: str,
    contract_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update existing contract
    """
    try:
        # Add update timestamp
        contract_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.contracts.update_one(
            {"id": contract_id},
            {"$set": contract_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Contract not found: {contract_id}"
            )
        
        # Fetch updated contract
        updated_contract = await tenant_db.contracts.find_one(
            {"id": contract_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_contract
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating contract: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/contracts/{contract_id}")
async def delete_contract(
    tenant_slug: str,
    contract_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete contract
    """
    try:
        result = await tenant_db.contracts.delete_one(
            {"id": contract_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Contract not found: {contract_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Contract {contract_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting contract: {str(e)}"
        )
