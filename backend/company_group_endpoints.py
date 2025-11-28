"""
Company Groups API Endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from datetime import datetime
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import os

logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = AsyncIOMotorClient(MONGO_URL)
db = client['test_database']

company_group_router = APIRouter(prefix="/api", tags=["company-groups"])


class CompanyInfo(BaseModel):
    id: str
    name: str
    address: str = ""
    city: str = ""
    country: str = ""
    phone: str = ""
    email: str = ""
    website: str = ""
    tax_office: str = ""
    tax_number: str = ""


class CompanyGroup(BaseModel):
    id: str
    name: str
    user_id: str
    companies: List[CompanyInfo] = []
    created_at: datetime = None
    updated_at: datetime = None


@company_group_router.get("/company-groups", response_model=List[CompanyGroup])
async def get_company_groups(user_id: str):
    """Get all company groups for a user"""
    try:
        groups = await db.company_groups.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(100)
        
        return groups
    except Exception as e:
        logger.error(f"Error fetching company groups: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@company_group_router.get("/company-groups/{group_id}/companies", response_model=List[CompanyInfo])
async def get_companies_from_group(group_id: str):
    """Get all companies from a specific group"""
    try:
        group = await db.company_groups.find_one(
            {"id": group_id},
            {"_id": 0}
        )
        
        if not group:
            raise HTTPException(status_code=404, detail="Company group not found")
        
        return group.get("companies", [])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching companies from group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
