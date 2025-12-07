"""
Tenant-Aware Reports Router
Multi-tenant reports and analytics endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime, timedelta

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/reports/sales")
async def get_sales_report(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get sales report for tenant
    
    Query params:
        - start_date: Report start date
        - end_date: Report end date
    """
    try:
        # Build date filter
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        
        query = {}
        if date_filter:
            query["invoiceDate"] = date_filter
        
        # Get invoices
        invoices = await tenant_db.invoices.find(
            query,
            {"_id": 0}
        ).to_list(None)
        
        # Calculate totals
        total_sales = sum(inv.get("total", 0) for inv in invoices)
        paid_invoices = [inv for inv in invoices if inv.get("status") == "paid"]
        total_paid = sum(inv.get("total", 0) for inv in paid_invoices)
        total_pending = total_sales - total_paid
        
        # Group by month
        monthly_sales = {}
        for inv in invoices:
            inv_date = inv.get("invoiceDate", "")
            if inv_date:
                month_key = inv_date[:7]  # YYYY-MM
                if month_key not in monthly_sales:
                    monthly_sales[month_key] = 0
                monthly_sales[month_key] += inv.get("total", 0)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "report": {
                "totalSales": total_sales,
                "totalPaid": total_paid,
                "totalPending": total_pending,
                "invoiceCount": len(invoices),
                "paidInvoiceCount": len(paid_invoices),
                "monthlySales": monthly_sales
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating sales report: {str(e)}"
        )


@router.get("/api/{tenant_slug}/reports/pipeline")
async def get_pipeline_report(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get sales pipeline report for tenant
    """
    try:
        # Get all opportunities
        opportunities = await tenant_db.opportunities.find(
            {},
            {"_id": 0}
        ).to_list(None)
        
        # Group by stage
        pipeline_stats = {}
        for opp in opportunities:
            stage = opp.get("stage", "unknown")
            if stage not in pipeline_stats:
                pipeline_stats[stage] = {
                    "count": 0,
                    "totalValue": 0
                }
            pipeline_stats[stage]["count"] += 1
            pipeline_stats[stage]["totalValue"] += opp.get("value", 0)
        
        # Calculate win rate
        total_opps = len(opportunities)
        won_opps = len([o for o in opportunities if o.get("status") == "won"])
        lost_opps = len([o for o in opportunities if o.get("status") == "lost"])
        win_rate = (won_opps / (won_opps + lost_opps) * 100) if (won_opps + lost_opps) > 0 else 0
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "report": {
                "totalOpportunities": total_opps,
                "wonOpportunities": won_opps,
                "lostOpportunities": lost_opps,
                "winRate": round(win_rate, 2),
                "pipelineByStage": pipeline_stats
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating pipeline report: {str(e)}"
        )


@router.get("/api/{tenant_slug}/reports/customers")
async def get_customers_report(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get customers report for tenant
    """
    try:
        # Get all customers
        customers = await tenant_db.customers.find(
            {},
            {"_id": 0}
        ).to_list(None)
        
        # Calculate stats
        total_customers = len(customers)
        active_customers = len([c for c in customers if c.get("status") == "active"])
        
        # Group by country
        by_country = {}
        for customer in customers:
            country = customer.get("country", "Unknown")
            if country not in by_country:
                by_country[country] = 0
            by_country[country] += 1
        
        # Group by sector
        by_sector = {}
        for customer in customers:
            sector = customer.get("sector", "Unknown")
            if sector not in by_sector:
                by_sector[sector] = 0
            by_sector[sector] += 1
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "report": {
                "totalCustomers": total_customers,
                "activeCustomers": active_customers,
                "byCountry": by_country,
                "bySector": by_sector
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating customers report: {str(e)}"
        )


@router.get("/api/{tenant_slug}/reports/performance")
async def get_performance_report(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    period: str = "30days"
):
    """
    Get performance report for tenant
    
    Query params:
        - period: Report period (7days, 30days, 90days, 1year)
    """
    try:
        # Calculate date range
        days_map = {
            "7days": 7,
            "30days": 30,
            "90days": 90,
            "1year": 365
        }
        days = days_map.get(period, 30)
        start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
        
        # Get recent activities
        activities_count = await tenant_db.activities.count_documents({
            "created_at": {"$gte": start_date}
        })
        
        # Get completed tasks
        completed_tasks = await tenant_db.tasks.count_documents({
            "status": "completed",
            "updatedAt": {"$gte": start_date}
        })
        
        # Get new customers
        new_customers = await tenant_db.customers.count_documents({
            "createdAt": {"$gte": start_date}
        })
        
        # Get new projects
        new_projects = await tenant_db.projects.count_documents({
            "createdAt": {"$gte": start_date}
        })
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "report": {
                "period": period,
                "activitiesCount": activities_count,
                "completedTasks": completed_tasks,
                "newCustomers": new_customers,
                "newProjects": new_projects
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating performance report: {str(e)}"
        )
