"""
Tenant Router Middleware
Handles tenant database routing for multi-tenant SaaS architecture
Created: 2025-12-07
"""

import os
from typing import Optional, Dict
from fastapi import HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)

# In-memory cache for tenant data
# Format: {tenant_slug: {"tenant": {...}, "expires_at": datetime, "db": database_object}}
_tenant_cache: Dict[str, dict] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


class TenantRouter:
    """
    Tenant database router with caching
    """
    
    @staticmethod
    async def get_platform_db() -> AsyncIOMotorDatabase:
        """
        Get platform database connection
        """
        return client["vitingo_platform"]
    
    @staticmethod
    async def validate_and_get_tenant(tenant_slug: str) -> dict:
        """
        Validate tenant and return tenant data (with caching)
        
        Args:
            tenant_slug: Tenant slug from URL
            
        Returns:
            dict: Tenant data from platform database
            
        Raises:
            HTTPException: If tenant not found or inactive
        """
        # Check cache first
        if tenant_slug in _tenant_cache:
            cached_entry = _tenant_cache[tenant_slug]
            if cached_entry["expires_at"] > datetime.now():
                logger.debug(f"Cache HIT for tenant: {tenant_slug}")
                return cached_entry["tenant"]
            else:
                # Cache expired, remove it
                logger.debug(f"Cache EXPIRED for tenant: {tenant_slug}")
                del _tenant_cache[tenant_slug]
        
        # Cache miss - query database
        logger.debug(f"Cache MISS for tenant: {tenant_slug}")
        platform_db = await TenantRouter.get_platform_db()
        
        tenant = await platform_db.tenants.find_one(
            {"slug": tenant_slug},
            {"_id": 0}
        )
        
        if not tenant:
            raise HTTPException(
                status_code=404,
                detail=f"Tenant not found: {tenant_slug}"
            )
        
        if tenant.get("status") != "active":
            raise HTTPException(
                status_code=403,
                detail=f"Tenant is not active: {tenant_slug}"
            )
        
        # Cache the tenant data
        _tenant_cache[tenant_slug] = {
            "tenant": tenant,
            "expires_at": datetime.now() + timedelta(seconds=CACHE_TTL_SECONDS)
        }
        
        logger.info(f"Tenant validated and cached: {tenant_slug}")
        return tenant
    
    @staticmethod
    async def get_tenant_db(tenant_slug: str) -> AsyncIOMotorDatabase:
        """
        Get tenant database connection
        
        Args:
            tenant_slug: Tenant slug from URL
            
        Returns:
            AsyncIOMotorDatabase: Tenant database connection
            
        Raises:
            HTTPException: If tenant not found or inactive
        """
        # Validate tenant first
        tenant = await TenantRouter.validate_and_get_tenant(tenant_slug)
        
        # Get database name from tenant record
        db_name = tenant.get("database_name", f"vitingo_t_{tenant_slug}")
        
        logger.debug(f"Connecting to tenant database: {db_name}")
        return client[db_name]
    
    @staticmethod
    async def extract_tenant_slug_from_path(path: str) -> Optional[str]:
        """
        Extract tenant slug from URL path
        Expected format: /api/{tenant_slug}/...
        
        Args:
            path: Request path
            
        Returns:
            Optional[str]: Tenant slug or None if not found
        """
        parts = path.strip("/").split("/")
        
        # Expected: ["api", "tenant_slug", "resource", ...]
        if len(parts) >= 2 and parts[0] == "api":
            tenant_slug = parts[1]
            # Simple validation: tenant_slug should not be a known non-tenant path
            non_tenant_paths = ["global", "health", "docs", "openapi.json", "auth"]
            if tenant_slug not in non_tenant_paths:
                return tenant_slug
        
        return None
    
    @staticmethod
    def clear_cache(tenant_slug: Optional[str] = None):
        """
        Clear tenant cache
        
        Args:
            tenant_slug: Specific tenant to clear, or None to clear all
        """
        global _tenant_cache
        
        if tenant_slug:
            if tenant_slug in _tenant_cache:
                del _tenant_cache[tenant_slug]
                logger.info(f"Cache cleared for tenant: {tenant_slug}")
        else:
            _tenant_cache = {}
            logger.info("All tenant cache cleared")


# Singleton instance
tenant_router = TenantRouter()


async def get_tenant_context(request: Request) -> dict:
    """
    FastAPI dependency to get tenant context from request
    
    Returns:
        dict: {
            "tenant_slug": str,
            "tenant": dict,
            "tenant_db": AsyncIOMotorDatabase
        }
    
    Raises:
        HTTPException: If tenant not found or inactive
    """
    # Extract tenant slug from path
    tenant_slug = await tenant_router.extract_tenant_slug_from_path(request.url.path)
    
    if not tenant_slug:
        raise HTTPException(
            status_code=400,
            detail="Tenant slug not found in URL path. Expected format: /api/{tenant_slug}/..."
        )
    
    # Validate and get tenant
    tenant = await tenant_router.validate_and_get_tenant(tenant_slug)
    
    # Get tenant database
    tenant_db = await tenant_router.get_tenant_db(tenant_slug)
    
    return {
        "tenant_slug": tenant_slug,
        "tenant": tenant,
        "tenant_db": tenant_db
    }
