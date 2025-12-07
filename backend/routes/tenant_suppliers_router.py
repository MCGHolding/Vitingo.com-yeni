"""
Tenant-Aware Suppliers Router
Multi-tenant suppliers endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/suppliers")
async def get_suppliers(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 100
):
    """
    Get suppliers for specific tenant
    
    Query params:
        - status: Filter by status (active, inactive)
        - category: Filter by category
        - limit: Maximum number of suppliers
    """
    try:
        query = {}
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        
        suppliers = await tenant_db.suppliers.find(
            query,
            {"_id": 0}
        ).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(suppliers),
            "data": suppliers
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching suppliers: {str(e)}"
        )


@router.get("/api/{tenant_slug}/suppliers/{supplier_id}")
async def get_supplier_by_id(
    tenant_slug: str,
    supplier_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single supplier by ID
    """
    try:
        supplier = await tenant_db.suppliers.find_one(
            {"id": supplier_id},
            {"_id": 0}
        )
        
        if not supplier:
            raise HTTPException(
                status_code=404,
                detail=f"Supplier not found: {supplier_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": supplier
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching supplier: {str(e)}"
        )


@router.post("/api/{tenant_slug}/suppliers")
async def create_supplier(
    tenant_slug: str,
    supplier_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new supplier
    """
    try:
        # Add timestamps
        supplier_data["createdAt"] = datetime.utcnow()
        supplier_data["updatedAt"] = datetime.utcnow()
        supplier_data["status"] = supplier_data.get("status", "active")
        
        result = await tenant_db.suppliers.insert_one(supplier_data)
        
        # Fetch the created supplier
        created_supplier = await tenant_db.suppliers.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_supplier
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating supplier: {str(e)}"
        )


@router.put("/api/{tenant_slug}/suppliers/{supplier_id}")
async def update_supplier(
    tenant_slug: str,
    supplier_id: str,
    supplier_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update existing supplier
    """
    try:
        # Add update timestamp
        supplier_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.suppliers.update_one(
            {"id": supplier_id},
            {"$set": supplier_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Supplier not found: {supplier_id}"
            )
        
        # Fetch updated supplier
        updated_supplier = await tenant_db.suppliers.find_one(
            {"id": supplier_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_supplier
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating supplier: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/suppliers/{supplier_id}")
async def delete_supplier(
    tenant_slug: str,
    supplier_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete supplier
    """
    try:
        result = await tenant_db.suppliers.delete_one(
            {"id": supplier_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Supplier not found: {supplier_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Supplier {supplier_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting supplier: {str(e)}"
        )
