"""
Tenant-Aware Calendar Router
Multi-tenant calendar events endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/calendar/events")
async def get_calendar_events(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100
):
    """
    Get calendar events for specific tenant
    
    Query params:
        - start_date: Filter events from this date
        - end_date: Filter events until this date
        - limit: Maximum number of events
    """
    try:
        query = {}
        if start_date or end_date:
            query["start_date"] = {}
            if start_date:
                query["start_date"]["$gte"] = start_date
            if end_date:
                query["start_date"]["$lte"] = end_date
        
        events = await tenant_db.calendar_events.find(
            query,
            {"_id": 0}
        ).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(events),
            "data": events
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching calendar events: {str(e)}"
        )


@router.get("/api/{tenant_slug}/calendar/events/{event_id}")
async def get_calendar_event_by_id(
    tenant_slug: str,
    event_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single calendar event by ID
    """
    try:
        event = await tenant_db.calendar_events.find_one(
            {"id": event_id},
            {"_id": 0}
        )
        
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Calendar event not found: {event_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": event
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching calendar event: {str(e)}"
        )


@router.post("/api/{tenant_slug}/calendar/events")
async def create_calendar_event(
    tenant_slug: str,
    event_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new calendar event
    """
    try:
        # Add timestamps
        event_data["createdAt"] = datetime.utcnow()
        event_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.calendar_events.insert_one(event_data)
        
        # Fetch the created event
        created_event = await tenant_db.calendar_events.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_event
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating calendar event: {str(e)}"
        )


@router.put("/api/{tenant_slug}/calendar/events/{event_id}")
async def update_calendar_event(
    tenant_slug: str,
    event_id: str,
    event_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Update existing calendar event
    """
    try:
        # Add update timestamp
        event_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.calendar_events.update_one(
            {"id": event_id},
            {"$set": event_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Calendar event not found: {event_id}"
            )
        
        # Fetch updated event
        updated_event = await tenant_db.calendar_events.find_one(
            {"id": event_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": updated_event
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating calendar event: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/calendar/events/{event_id}")
async def delete_calendar_event(
    tenant_slug: str,
    event_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete calendar event
    """
    try:
        result = await tenant_db.calendar_events.delete_one(
            {"id": event_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Calendar event not found: {event_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Calendar event {event_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting calendar event: {str(e)}"
        )
