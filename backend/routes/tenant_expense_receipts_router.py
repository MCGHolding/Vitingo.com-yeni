"""
Tenant-Aware Expense Receipts Router
Multi-tenant expense receipts endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/expense-receipts")
async def get_expense_receipts(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 100
):
    """
    Get expense receipts for specific tenant
    
    Query params:
        - status: Filter by status (pending, approved, rejected)
        - category: Filter by category
        - limit: Maximum number of receipts
    """
    try:
        query = {}
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        
        receipts = await tenant_db.expense_receipts.find(
            query,
            {"_id": 0}
        ).sort("date", -1).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(receipts),
            "data": receipts
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching expense receipts: {str(e)}"
        )


@router.get("/api/{tenant_slug}/expense-receipts/{receipt_id}")
async def get_expense_receipt_by_id(
    tenant_slug: str,
    receipt_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single expense receipt by ID
    """
    try:
        receipt = await tenant_db.expense_receipts.find_one(
            {"id": receipt_id},
            {"_id": 0}
        )
        
        if not receipt:
            raise HTTPException(
                status_code=404,
                detail=f"Expense receipt not found: {receipt_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": receipt
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching expense receipt: {str(e)}"
        )


@router.post("/api/{tenant_slug}/expense-receipts")
async def create_expense_receipt(
    tenant_slug: str,
    receipt_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new expense receipt
    """
    try:
        # Add timestamps
        receipt_data["createdAt"] = datetime.utcnow()
        receipt_data["updatedAt"] = datetime.utcnow()
        receipt_data["status"] = receipt_data.get("status", "pending")
        
        result = await tenant_db.expense_receipts.insert_one(receipt_data)
        
        # Fetch the created receipt
        created_receipt = await tenant_db.expense_receipts.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_receipt
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating expense receipt: {str(e)}"
        )


@router.put("/api/{tenant_slug}/expense-receipts/{receipt_id}")
async def update_expense_receipt(
    tenant_slug: str,
    receipt_id: str,
    receipt_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update existing expense receipt
    """
    try:
        # Add update timestamp
        receipt_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.expense_receipts.update_one(
            {"id": receipt_id},
            {"$set": receipt_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Expense receipt not found: {receipt_id}"
            )
        
        # Fetch updated receipt
        updated_receipt = await tenant_db.expense_receipts.find_one(
            {"id": receipt_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_receipt
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating expense receipt: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/expense-receipts/{receipt_id}")
async def delete_expense_receipt(
    tenant_slug: str,
    receipt_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete expense receipt
    """
    try:
        result = await tenant_db.expense_receipts.delete_one(
            {"id": receipt_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Expense receipt not found: {receipt_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Expense receipt {receipt_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting expense receipt: {str(e)}"
        )
