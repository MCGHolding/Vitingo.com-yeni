"""
FastAPI Dependencies for Multi-Tenant SaaS
Provides dependency injection for tenant and platform database access
Created: 2025-12-07
"""

import os
from typing import Dict
from fastapi import Request, Depends
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from middleware.tenant_router import get_tenant_context, tenant_router

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)


async def get_platform_db() -> AsyncIOMotorDatabase:
    """
    Dependency to get platform database connection
    
    Returns:
        AsyncIOMotorDatabase: vitingo_platform database
    
    Usage:
        @app.get("/some-endpoint")
        async def endpoint(platform_db: AsyncIOMotorDatabase = Depends(get_platform_db)):
            users = await platform_db.users.find().to_list(100)
    """
    return client["vitingo_platform"]


async def get_tenant_db(tenant_context: Dict = Depends(get_tenant_context)) -> AsyncIOMotorDatabase:
    """
    Dependency to get tenant database connection
    
    Returns:
        AsyncIOMotorDatabase: Tenant-specific database
    
    Usage:
        @app.get("/api/{tenant_slug}/customers")
        async def get_customers(tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db)):
            customers = await tenant_db.customers.find().to_list(100)
    """
    return tenant_context["tenant_db"]


async def get_tenant_info(tenant_context: Dict = Depends(get_tenant_context)) -> dict:
    """
    Dependency to get tenant information
    
    Returns:
        dict: Tenant data from platform database
    
    Usage:
        @app.get("/api/{tenant_slug}/info")
        async def get_info(tenant: dict = Depends(get_tenant_info)):
            return {"tenant_name": tenant["name"]}
    """
    return tenant_context["tenant"]


async def get_tenant_slug(tenant_context: Dict = Depends(get_tenant_context)) -> str:
    """
    Dependency to get tenant slug
    
    Returns:
        str: Tenant slug from URL
    
    Usage:
        @app.get("/api/{tenant_slug}/something")
        async def endpoint(tenant_slug: str = Depends(get_tenant_slug)):
            return {"tenant": tenant_slug}
    """
    return tenant_context["tenant_slug"]


async def get_full_tenant_context(tenant_context: Dict = Depends(get_tenant_context)) -> Dict:
    """
    Dependency to get full tenant context (all information)
    
    Returns:
        Dict: {
            "tenant_slug": str,
            "tenant": dict,
            "tenant_db": AsyncIOMotorDatabase
        }
    
    Usage:
        @app.get("/api/{tenant_slug}/resource")
        async def endpoint(context: Dict = Depends(get_full_tenant_context)):
            tenant_slug = context["tenant_slug"]
            tenant = context["tenant"]
            tenant_db = context["tenant_db"]
    """
    return tenant_context
