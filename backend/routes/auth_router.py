"""
Authentication endpoints for multi-tenant SaaS platform
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime

from dependencies import get_platform_db
from auth_utils import (
    verify_password,
    create_access_token,
    decode_access_token,
    verify_token_tenant
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# Request/Response Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    tenant: dict


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    tenant_id: str
    tenant_slug: str
    department: Optional[str] = None


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    platform_db: AsyncIOMotorDatabase = Depends(get_platform_db)
):
    """
    Authenticate user and return JWT token
    
    Flow:
    1. Find user by email in vitingo_platform.users
    2. Verify password
    3. Get tenant info from vitingo_platform.tenants
    4. Generate JWT with tenant info
    5. Return token + user info + tenant info
    """
    
    # Find user by email (email is globally unique across platform)
    user = await platform_db.users.find_one(
        {"email": credentials.email},
        {"_id": 0}
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not user.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is not properly configured"
        )
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if user.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {user.get('status', 'inactive')}"
        )
    
    # Get tenant info
    tenant = await platform_db.tenants.find_one(
        {"id": user["tenant_id"]},
        {"_id": 0}
    )
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User's tenant not found"
        )
    
    if tenant.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Tenant is {tenant.get('status', 'inactive')}"
        )
    
    # Create JWT token with tenant info
    token_data = {
        "user_id": user["id"],
        "email": user["email"],
        "tenant_id": user["tenant_id"],
        "tenant_slug": tenant["slug"],
        "role": user.get("role", "user")
    }
    
    access_token = create_access_token(data=token_data)
    
    # Update last login time
    await platform_db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "last_login": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
        }
    )
    
    # Prepare user response (without sensitive data)
    user_response = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role", "user"),
        "tenant_id": user["tenant_id"],
        "tenant_slug": tenant["slug"],
        "department": user.get("department"),
        "avatar": user.get("avatar")
    }
    
    # Prepare tenant response
    tenant_response = {
        "id": tenant["id"],
        "slug": tenant["slug"],
        "name": tenant["name"],
        "database_name": tenant["database_name"],
        "package": tenant.get("package", "basic")
    }
    
    return LoginResponse(
        access_token=access_token,
        user=user_response,
        tenant=tenant_response
    )


@router.post("/logout")
async def logout():
    """
    Logout endpoint (client-side token removal)
    
    Since JWT is stateless, logout is handled on client side by removing token.
    This endpoint exists for consistency and future server-side token blacklisting.
    """
    return {
        "status": "success",
        "message": "Logged out successfully"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    authorization: Optional[str] = Header(None),
    platform_db: AsyncIOMotorDatabase = Depends(get_platform_db)
):
    """
    Get current authenticated user info from JWT token
    
    Headers:
        Authorization: Bearer <token>
    """
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = authorization.split(" ")[1]
    
    # Decode and verify token
    payload = decode_access_token(token)
    
    # Get fresh user data from database
    user = await platform_db.users.find_one(
        {"id": payload["user_id"]},
        {"_id": 0}
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user.get("role", "user"),
        tenant_id=user["tenant_id"],
        tenant_slug=payload["tenant_slug"],
        department=user.get("department")
    )


@router.get("/verify-token")
async def verify_token(
    authorization: Optional[str] = Header(None)
):
    """
    Verify if JWT token is valid
    
    Returns token payload if valid, raises exception if invalid
    """
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    
    return {
        "status": "valid",
        "payload": payload
    }
