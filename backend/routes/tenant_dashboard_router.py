"""
Tenant-Aware Dashboard Router
Multi-tenant dashboard data endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime, timedelta

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/dashboard/overview")
async def get_dashboard_overview(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get dashboard overview with key metrics
    """
    try:
        # Get counts for all main collections
        customers_count = await tenant_db.customers.count_documents({})
        active_customers = await tenant_db.customers.count_documents({"status": "active"})
        projects_count = await tenant_db.projects.count_documents({})
        active_projects = await tenant_db.projects.count_documents({"status": "active"})
        leads_count = await tenant_db.leads.count_documents({})
        products_count = await tenant_db.products.count_documents({})
        tasks_count = await tenant_db.tasks.count_documents({})
        pending_tasks = await tenant_db.tasks.count_documents({"status": "pending"})
        
        # Get recent activities (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_activities_count = await tenant_db.activities.count_documents({
            "created_at": {"$gte": seven_days_ago}
        })
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"],
                "package": tenant["subscription"]["package_key"]
            },
            "overview": {
                "customers": {
                    "total": customers_count,
                    "active": active_customers
                },
                "projects": {
                    "total": projects_count,
                    "active": active_projects
                },
                "leads": {
                    "total": leads_count
                },
                "products": {
                    "total": products_count
                },
                "tasks": {
                    "total": tasks_count,
                    "pending": pending_tasks
                },
                "recent_activities": {
                    "last_7_days": recent_activities_count
                }
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching dashboard overview: {str(e)}"
        )


@router.get("/api/{tenant_slug}/dashboard/recent-activities")
async def get_recent_activities(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    limit: int = 20
):
    """
    Get recent activities for dashboard
    """
    try:
        activities = await tenant_db.activities.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(activities),
            "data": activities
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching recent activities: {str(e)}"
        )


@router.get("/api/{tenant_slug}/dashboard/upcoming-tasks")
async def get_upcoming_tasks(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    limit: int = 10
):
    """
    Get upcoming tasks for dashboard
    """
    try:
        tasks = await tenant_db.tasks.find(
            {"status": {"$ne": "completed"}},
            {"_id": 0}
        ).sort("due_date", 1).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(tasks),
            "data": tasks
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching upcoming tasks: {str(e)}"
        )


@router.get("/api/{tenant_slug}/dashboard/upcoming-events")
async def get_upcoming_events(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    limit: int = 10
):
    """
    Get upcoming calendar events for dashboard
    """
    try:
        today = datetime.utcnow().isoformat()
        
        events = await tenant_db.calendar_events.find(
            {"start_date": {"$gte": today}},
            {"_id": 0}
        ).sort("start_date", 1).limit(limit).to_list(limit)
        
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
            detail=f"Error fetching upcoming events: {str(e)}"
        )
