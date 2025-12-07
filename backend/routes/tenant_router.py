"""
Tenant-Aware API Routes
Multi-tenant endpoints with database routing
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict

from dependencies import (
    get_tenant_db,
    get_tenant_info,
    get_tenant_slug,
    get_full_tenant_context,
    get_platform_db,
    verify_tenant_access
)

# Create router
router = APIRouter()


@router.get("/api/{tenant_slug}/test")
async def test_tenant_routing(
    tenant_slug: str,
    context: Dict = Depends(get_full_tenant_context)
):
    """
    Test endpoint to verify tenant routing is working
    
    Returns:
        - Tenant information
        - Database connection status
        - Sample data counts
    """
    tenant_db = context["tenant_db"]
    tenant = context["tenant"]
    
    # Get collection counts
    collections = await tenant_db.list_collection_names()
    collection_counts = {}
    
    for col_name in collections:
        count = await tenant_db[col_name].count_documents({})
        collection_counts[col_name] = count
    
    return {
        "status": "success",
        "message": "Tenant routing is working!",
        "tenant_info": {
            "slug": tenant["slug"],
            "name": tenant["name"],
            "id": tenant["id"],
            "status": tenant["status"],
            "package": tenant["subscription"]["package_key"],
            "database_name": tenant.get("database_name", f"vitingo_t_{tenant_slug}")
        },
        "database_stats": {
            "total_collections": len(collections),
            "collections": collection_counts,
            "total_documents": sum(collection_counts.values())
        }
    }


@router.get("/api/{tenant_slug}/customers")
async def get_customers(
    tenant_slug: str,
    tenant_context: Dict = Depends(verify_tenant_access),
    limit: int = 100
):
    """
    Get customers for specific tenant (tenant-aware)
    
    Query params:
        - limit: Maximum number of customers to return (default: 100)
    
    Returns:
        List of customers from tenant database
    """
    try:
        # Fetch customers from tenant database (without _id)
        customers = await tenant_db.customers.find(
            {},
            {"_id": 0}
        ).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(customers),
            "data": customers
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching customers: {str(e)}"
        )


@router.get("/api/{tenant_slug}/customers/{customer_id}")
async def get_customer_by_id(
    tenant_slug: str,
    customer_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single customer by ID (tenant-aware)
    
    Path params:
        - tenant_slug: Tenant identifier
        - customer_id: Customer ID
    
    Returns:
        Customer data
    """
    try:
        customer = await tenant_db.customers.find_one(
            {"id": customer_id},
            {"_id": 0}
        )
        
        if not customer:
            raise HTTPException(
                status_code=404,
                detail=f"Customer not found: {customer_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": customer
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching customer: {str(e)}"
        )


@router.get("/api/{tenant_slug}/products")
async def get_products(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    limit: int = 100
):
    """
    Get products for specific tenant (tenant-aware)
    
    Query params:
        - limit: Maximum number of products to return (default: 100)
    
    Returns:
        List of products from tenant database
    """
    try:
        products = await tenant_db.products.find(
            {},
            {"_id": 0}
        ).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(products),
            "data": products
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching products: {str(e)}"
        )


@router.get("/api/{tenant_slug}/leads")
async def get_leads(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    limit: int = 100
):
    """
    Get leads for specific tenant (tenant-aware)
    
    Query params:
        - limit: Maximum number of leads to return (default: 100)
    
    Returns:
        List of leads from tenant database
    """
    try:
        leads = await tenant_db.leads.find(
            {},
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


@router.get("/api/{tenant_slug}/stats")
async def get_tenant_stats(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get statistics for tenant (tenant-aware)
    
    Returns:
        Document counts for all collections
    """
    try:
        stats = {
            "customers": await tenant_db.customers.count_documents({}),
            "products": await tenant_db.products.count_documents({}),
            "leads": await tenant_db.leads.count_documents({}),
            "projects": await tenant_db.projects.count_documents({}),
            "calendar_events": await tenant_db.calendar_events.count_documents({}),
            "tasks": await tenant_db.tasks.count_documents({}),
            "documents": await tenant_db.documents.count_documents({}),
            "activities": await tenant_db.activities.count_documents({})
        }
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"],
                "package": tenant["subscription"]["package_key"]
            },
            "stats": stats,
            "total_documents": sum(stats.values())
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching stats: {str(e)}"
        )
