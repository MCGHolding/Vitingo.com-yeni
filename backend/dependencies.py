"""
FastAPI Dependencies for Multi-Tenant SaaS
Provides dependency injection for tenant and platform database access
Created: 2025-12-07
"""

import os
from typing import Dict, Optional
from fastapi import Request, Depends, HTTPException, Header, status
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from middleware.tenant_router import get_tenant_context, tenant_router
from auth_utils import decode_access_token

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


async def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[Dict]:
    """
    Dependency to get current user from JWT token (optional - doesn't require auth)
    
    Returns:
        dict | None: User payload from JWT or None if no token
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    try:
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        return payload
    except:
        return None


async def get_current_user_required(authorization: Optional[str] = Header(None)) -> Dict:
    """
    Dependency to get current user from JWT token (required - raises exception if not authenticated)
    
    Returns:
        dict: User payload from JWT
        
    Raises:
        HTTPException: 401 if not authenticated
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    return payload


async def verify_tenant_access(
    tenant_context: Dict = Depends(get_tenant_context),
    current_user: Dict = Depends(get_current_user_required)
) -> Dict:
    """
    Dependency to verify that user has access to the requested tenant
    
    This is the KEY security check for multi-tenant isolation!
    
    Returns:
        dict: Tenant context if authorized
        
    Raises:
        HTTPException: 403 if user doesn't have access to this tenant
    """
    url_tenant_slug = tenant_context["tenant_slug"]
    token_tenant_slug = current_user.get("tenant_slug")
    
    if not token_tenant_slug:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token does not contain tenant information"
        )
    
    # Both slugs should match (both use underscore format in backend)
    if url_tenant_slug != token_tenant_slug:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: You don't have permission to access this tenant. Your tenant: {token_tenant_slug}, Requested: {url_tenant_slug}"
        )
    
    # Add user info to tenant context
    tenant_context["current_user"] = current_user
    return tenant_context


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
