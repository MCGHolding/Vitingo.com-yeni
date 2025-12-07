"""
Tenant-Aware Invoices Router
Multi-tenant invoices endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/invoices")
async def get_invoices(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    limit: int = 100
):
    """
    Get invoices for specific tenant
    
    Query params:
        - status: Filter by status (draft, sent, paid, overdue)
        - customer_id: Filter by customer
        - limit: Maximum number of invoices
    """
    try:
        query = {}
        if status:
            query["status"] = status
        if customer_id:
            query["customerId"] = customer_id
        
        invoices = await tenant_db.invoices.find(
            query,
            {"_id": 0}
        ).sort("invoiceDate", -1).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(invoices),
            "data": invoices
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching invoices: {str(e)}"
        )


@router.get("/api/{tenant_slug}/invoices/{invoice_id}")
async def get_invoice_by_id(
    tenant_slug: str,
    invoice_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single invoice by ID
    """
    try:
        invoice = await tenant_db.invoices.find_one(
            {"invoiceNumber": invoice_id},
            {"_id": 0}
        )
        
        if not invoice:
            raise HTTPException(
                status_code=404,
                detail=f"Invoice not found: {invoice_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": invoice
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching invoice: {str(e)}"
        )


@router.post("/api/{tenant_slug}/invoices")
async def create_invoice(
    tenant_slug: str,
    invoice_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new invoice
    """
    try:
        # Add timestamps
        invoice_data["createdAt"] = datetime.utcnow()
        invoice_data["updatedAt"] = datetime.utcnow()
        invoice_data["status"] = invoice_data.get("status", "draft")
        
        result = await tenant_db.invoices.insert_one(invoice_data)
        
        # Fetch the created invoice
        created_invoice = await tenant_db.invoices.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_invoice
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating invoice: {str(e)}"
        )


@router.put("/api/{tenant_slug}/invoices/{invoice_id}")
async def update_invoice(
    tenant_slug: str,
    invoice_id: str,
    invoice_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update existing invoice
    """
    try:
        # Add update timestamp
        invoice_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.invoices.update_one(
            {"invoiceNumber": invoice_id},
            {"$set": invoice_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Invoice not found: {invoice_id}"
            )
        
        # Fetch updated invoice
        updated_invoice = await tenant_db.invoices.find_one(
            {"invoiceNumber": invoice_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_invoice
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating invoice: {str(e)}"
        )


@router.patch("/api/{tenant_slug}/invoices/{invoice_id}/status")
async def update_invoice_status(
    tenant_slug: str,
    invoice_id: str,
    status_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update invoice status
    """
    try:
        new_status = status_data.get("status")
        if not new_status:
            raise HTTPException(status_code=400, detail="Status is required")
        
        result = await tenant_db.invoices.update_one(
            {"invoiceNumber": invoice_id},
            {"$set": {"status": new_status, "updatedAt": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Invoice not found: {invoice_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Invoice status updated to {new_status}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating invoice status: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/invoices/{invoice_id}")
async def delete_invoice(
    tenant_slug: str,
    invoice_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete invoice
    """
    try:
        result = await tenant_db.invoices.delete_one(
            {"invoiceNumber": invoice_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Invoice not found: {invoice_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Invoice {invoice_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting invoice: {str(e)}"
        )


@router.get("/api/{tenant_slug}/invoices/next-number/{currency}")
async def get_next_invoice_number(
    tenant_slug: str,
    currency: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get next invoice number for currency
    """
    try:
        # Find highest invoice number for this currency
        last_invoice = await tenant_db.invoices.find_one(
            {"currency": currency},
            sort=[("invoiceNumber", -1)]
        )
        
        if last_invoice:
            last_number = int(last_invoice.get("invoiceNumber", "0").split("-")[-1])
            next_number = last_number + 1
        else:
            next_number = 1
        
        next_invoice_number = f"{currency}-{next_number:05d}"
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "nextInvoiceNumber": next_invoice_number
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting next invoice number: {str(e)}"
        )
