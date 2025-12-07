"""
Tenant-Aware People Router
Multi-tenant people/contacts endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/people")
async def get_people(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    customer_id: Optional[str] = None,
    role: Optional[str] = None,
    limit: int = 100
):
    """
    Get people/contacts for specific tenant
    
    Query params:
        - customer_id: Filter by customer
        - role: Filter by role
        - limit: Maximum number of people
    """
    try:
        query = {}
        if customer_id:
            query["customerId"] = customer_id
        if role:
            query["role"] = role
        
        people = await tenant_db.people.find(
            query,
            {"_id": 0}
        ).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(people),
            "data": people
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching people: {str(e)}"
        )


@router.get("/api/{tenant_slug}/people/{person_id}")
async def get_person_by_id(
    tenant_slug: str,
    person_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single person by ID
    """
    try:
        person = await tenant_db.people.find_one(
            {"id": person_id},
            {"_id": 0}
        )
        
        if not person:
            raise HTTPException(
                status_code=404,
                detail=f"Person not found: {person_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": person
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching person: {str(e)}"
        )


@router.post("/api/{tenant_slug}/people")
async def create_person(
    tenant_slug: str,
    person_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new person/contact
    """
    try:
        # Add timestamps
        person_data["createdAt"] = datetime.utcnow()
        person_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.people.insert_one(person_data)
        
        # Fetch the created person
        created_person = await tenant_db.people.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_person
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating person: {str(e)}"
        )


@router.put("/api/{tenant_slug}/people/{person_id}")
async def update_person(
    tenant_slug: str,
    person_id: str,
    person_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update existing person
    """
    try:
        # Add update timestamp
        person_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.people.update_one(
            {"id": person_id},
            {"$set": person_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Person not found: {person_id}"
            )
        
        # Fetch updated person
        updated_person = await tenant_db.people.find_one(
            {"id": person_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_person
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating person: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/people/{person_id}")
async def delete_person(
    tenant_slug: str,
    person_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete person
    """
    try:
        result = await tenant_db.people.delete_one(
            {"id": person_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Person not found: {person_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Person {person_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting person: {str(e)}"
        )
