"""
JWT Authentication Middleware for multi-tenant SaaS
"""
from fastapi import Request, HTTPException, status
from typing import Optional
from auth_utils import decode_access_token, verify_token_tenant


async def get_current_user_from_token(request: Request) -> Optional[dict]:
    """
    Extract and verify JWT token from request headers
    
    Returns:
        User payload from JWT token or None if no token
    
    Raises:
        HTTPException if token is invalid
    """
    authorization = request.headers.get("Authorization")
    
    if not authorization:
        return None
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected: 'Bearer <token>'"
        )
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    
    return payload


async def require_auth(request: Request) -> dict:
    """
    Require authentication - raises exception if not authenticated
    
    Usage as dependency:
        @router.get("/protected")
        async def protected_route(user: dict = Depends(require_auth)):
            return {"user": user}
    """
    user_payload = await get_current_user_from_token(request)
    
    if not user_payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return user_payload


async def require_tenant_access(request: Request, tenant_slug: str) -> dict:
    """
    Require authentication AND verify tenant access
    
    Args:
        request: FastAPI request
        tenant_slug: Tenant slug from URL path
    
    Returns:
        User payload if authenticated and has tenant access
    
    Raises:
        HTTPException if not authenticated or wrong tenant
    """
    user_payload = await require_auth(request)
    
    # Verify tenant access
    verify_token_tenant(user_payload, tenant_slug)
    
    return user_payload


async def require_role(request: Request, allowed_roles: list[str]) -> dict:
    """
    Require specific role(s)
    
    Args:
        request: FastAPI request
        allowed_roles: List of allowed roles (e.g., ['admin', 'super_admin'])
    
    Returns:
        User payload if has required role
    
    Raises:
        HTTPException if user doesn't have required role
    """
    user_payload = await require_auth(request)
    
    user_role = user_payload.get("role", "user")
    
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required roles: {', '.join(allowed_roles)}"
        )
    
    return user_payload


def get_optional_user(request: Request) -> Optional[dict]:
    """
    Get user from token if present, but don't require auth
    
    Useful for endpoints that work differently for authenticated users
    but are also accessible anonymously
    """
    try:
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            return None
        
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        return payload
    except:
        return None
