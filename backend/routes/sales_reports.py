from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from collections import defaultdict

router = APIRouter(prefix="/api/reports", tags=["sales-reports"])

# Dependency to get database
async def get_db():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    return db

# Helper Functions
def get_date_range(period: str, custom_start: str = None, custom_end: str = None):
    """Calculate date range based on period"""
    now = datetime.now(timezone.utc)
    
    if period == 'today':
        start = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)
        end = datetime(now.year, now.month, now.day, 23, 59, 59, tzinfo=timezone.utc)
    elif period == 'this_week':
        start = now - timedelta(days=now.weekday())
        start = datetime(start.year, start.month, start.day, 0, 0, 0, tzinfo=timezone.utc)
        end = start + timedelta(days=6, hours=23, minutes=59, seconds=59)
    elif period == 'this_month':
        start = datetime(now.year, now.month, 1, 0, 0, 0, tzinfo=timezone.utc)
        if now.month == 12:
            end = datetime(now.year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        else:
            next_month = datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)
            end = next_month - timedelta(seconds=1)
    elif period == 'this_quarter':
        quarter = (now.month - 1) // 3
        start = datetime(now.year, quarter * 3 + 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        end_month = (quarter + 1) * 3
        if end_month == 12:
            end = datetime(now.year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        else:
            next_quarter_start = datetime(now.year, end_month + 1, 1, tzinfo=timezone.utc)
            end = next_quarter_start - timedelta(seconds=1)
    elif period == 'this_year':
        start = datetime(now.year, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        end = datetime(now.year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
    elif period == 'last_month':
        if now.month == 1:
            start = datetime(now.year - 1, 12, 1, 0, 0, 0, tzinfo=timezone.utc)
            end = datetime(now.year - 1, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        else:
            start = datetime(now.year, now.month - 1, 1, 0, 0, 0, tzinfo=timezone.utc)
            end = datetime(now.year, now.month, 1, tzinfo=timezone.utc) - timedelta(seconds=1)
    elif period == 'last_quarter':
        current_quarter = (now.month - 1) // 3
        if current_quarter == 0:
            year = now.year - 1
            quarter = 3
        else:
            year = now.year
            quarter = current_quarter - 1
        start = datetime(year, quarter * 3 + 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        end_month = (quarter + 1) * 3
        if end_month == 12:
            end = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        else:
            next_quarter_start = datetime(year, end_month + 1, 1, tzinfo=timezone.utc)
            end = next_quarter_start - timedelta(seconds=1)
    elif period == 'last_year':
        start = datetime(now.year - 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        end = datetime(now.year - 1, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
    elif period == 'custom' and custom_start and custom_end:
        start = datetime.fromisoformat(custom_start.replace('Z', '+00:00'))
        end = datetime.fromisoformat(custom_end.replace('Z', '+00:00'))
    else:
        # Default to this month
        start = datetime(now.year, now.month, 1, 0, 0, 0, tzinfo=timezone.utc)
        if now.month == 12:
            end = datetime(now.year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        else:
            next_month = datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)
            end = next_month - timedelta(seconds=1)
    
    return {'start': start, 'end': end}

def calculate_change_percentage(current: float, previous: float) -> float:
    """Calculate percentage change"""
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return ((current - previous) / previous) * 100

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                if isinstance(value, ObjectId):
                    result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, list):
                result[key] = [serialize_doc(item) for item in value]
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    return doc


# ========================
# 1. SATIŞ ÖZETİ (DASHBOARD)
# ========================

@router.get("/summary")
async def get_sales_summary(
    period: str = Query('this_month', description="Period: today, this_week, this_month, this_quarter, this_year, last_month, last_quarter, last_year, custom"),
    start_date: Optional[str] = Query(None, alias="startDate"),
    end_date: Optional[str] = Query(None, alias="endDate"),
    currency: Optional[str] = None,
    user_id: Optional[str] = Query(None, alias="userId"),
    fair_id: Optional[str] = Query(None, alias="fairId"),
    db = Depends(get_db)
):
    """Get sales summary dashboard data"""
    try:
        # Get date range
        date_range = get_date_range(period, start_date, end_date)
        start, end = date_range['start'], date_range['end']
        
        # Calculate previous period
        period_length = end - start
        prev_start = start - period_length
        prev_end = start - timedelta(seconds=1)
        
        # Build base query
        base_match = {
            "createdAt": {"$gte": start, "$lte": end}
        }
        
        # Add filters
        if user_id:
            try:
                base_match["assignedTo"] = ObjectId(user_id)
            except:
                pass
        
        if fair_id:
            try:
                base_match["fairId"] = ObjectId(fair_id)
            except:
                pass
        
        # Previous period match
        prev_match = dict(base_match)
        prev_match["createdAt"] = {"$gte": prev_start, "$lte": prev_end}
        
        # Get opportunities collection
        opportunities = db["opportunities"]
        
        # Current period stats
        pipeline = [
            {"$match": base_match},
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": 1},
                    "won": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["won", "kazanildi", "kazanıldı"]]},
                                1,
                                0
                            ]
                        }
                    },
                    "lost": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["lost", "kaybedildi"]]},
                                1,
                                0
                            ]
                        }
                    },
                    "totalValue": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["won", "kazanildi", "kazanıldı"]]},
                                "$value",
                                0
                            ]
                        }
                    },
                    "avgValue": {"$avg": "$value"},
                    "totalSquareMeters": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["won", "kazanildi", "kazanıldı"]]},
                                {"$ifNull": ["$squareMeters", 0]},
                                0
                            ]
                        }
                    }
                }
            }
        ]
        
        current_stats_cursor = opportunities.aggregate(pipeline)
        current_stats_list = await current_stats_cursor.to_list(length=1)
        current = current_stats_list[0] if current_stats_list else {
            "total": 0, "won": 0, "lost": 0, "totalValue": 0, "avgValue": 0, "totalSquareMeters": 0
        }
        
        # Previous period stats
        prev_pipeline = [
            {"$match": prev_match},
            {
                "$group": {
                    "_id": None,
                    "totalValue": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["won", "kazanildi", "kazanıldı"]]},
                                "$value",
                                0
                            ]
                        }
                    },
                    "won": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["won", "kazanildi", "kazanıldı"]]},
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]
        
        prev_stats_cursor = opportunities.aggregate(prev_pipeline)
        prev_stats_list = await prev_stats_cursor.to_list(length=1)
        previous = prev_stats_list[0] if prev_stats_list else {"totalValue": 0, "won": 0}
        
        # Currency breakdown
        currency_pipeline = [
            {"$match": {**base_match, "status": {"$in": ["won", "kazanildi", "kazanıldı"]}}},
            {
                "$group": {
                    "_id": "$currency",
                    "totalValue": {"$sum": "$value"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"totalValue": -1}}
        ]
        
        currency_cursor = opportunities.aggregate(currency_pipeline)
        currency_breakdown_list = await currency_cursor.to_list(length=None)
        
        total_currency_value = sum(c["totalValue"] for c in currency_breakdown_list)
        currency_breakdown = [
            {
                "currency": c["_id"] if c["_id"] else "EUR",
                "totalValue": c["totalValue"],
                "count": c["count"],
                "percentage": round((c["totalValue"] / total_currency_value) * 100) if total_currency_value > 0 else 0
            }
            for c in currency_breakdown_list
        ]
        
        # Proposal stats (if proposals collection exists)
        try:
            proposals = db["proposals"]
            proposal_pipeline = [
                {"$match": {"createdAt": {"$gte": start, "$lte": end}}},
                {
                    "$group": {
                        "_id": "$status",
                        "count": {"$sum": 1},
                        "totalValue": {"$sum": "$totalAmount"}
                    }
                }
            ]
            proposal_cursor = proposals.aggregate(proposal_pipeline)
            proposal_stats_list = await proposal_cursor.to_list(length=None)
            proposal_stats = [
                {
                    "status": p["_id"],
                    "count": p["count"],
                    "totalValue": p.get("totalValue", 0)
                }
                for p in proposal_stats_list
            ]
        except:
            proposal_stats = []
        
        # Monthly trend (last 6 months)
        six_months_ago = now - timedelta(days=180)
        monthly_trend_pipeline = [
            {
                "$match": {
                    "createdAt": {"$gte": six_months_ago},
                    "status": {"$in": ["won", "kazanildi", "kazanıldı"]}
                }
            },
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$createdAt"},
                        "month": {"$month": "$createdAt"}
                    },
                    "revenue": {"$sum": "$value"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        
        now = datetime.now(timezone.utc)
        monthly_cursor = opportunities.aggregate(monthly_trend_pipeline)
        monthly_trend_list = await monthly_cursor.to_list(length=None)
        
        # Format monthly trend
        month_names = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
        monthly_trend = [
            {
                "month": f"{m['_id']['year']}-{str(m['_id']['month']).zfill(2)}",
                "monthName": month_names[m['_id']['month'] - 1],
                "revenue": m["revenue"],
                "count": m["count"]
            }
            for m in monthly_trend_list
        ]
        
        # Recent wins
        recent_wins_cursor = opportunities.find(
            {"status": {"$in": ["won", "kazanildi", "kazanıldı"]}}
        ).sort("updatedAt", -1).limit(5)
        recent_wins_list = await recent_wins_cursor.to_list(length=5)
        
        recent_wins = []
        for w in recent_wins_list:
            customer_name = w.get("customerName", "Bilinmeyen")
            if w.get("customerId"):
                try:
                    customer = await db["customers"].find_one({"_id": ObjectId(w["customerId"])}, {"_id": 0, "companyName": 1})
                    if customer:
                        customer_name = customer.get("companyName", customer_name)
                except:
                    pass
            
            fair_name = w.get("fairName", "-")
            if w.get("fairId"):
                try:
                    fair = await db["fairs"].find_one({"_id": ObjectId(w["fairId"])}, {"_id": 0, "name": 1})
                    if fair:
                        fair_name = fair.get("name", fair_name)
                except:
                    pass
            
            recent_wins.append({
                "id": str(w.get("_id", "")),
                "customerName": customer_name,
                "fairName": fair_name,
                "value": w.get("value", 0),
                "currency": w.get("currency", "EUR"),
                "date": w.get("updatedAt", w.get("createdAt")).isoformat() if w.get("updatedAt") or w.get("createdAt") else None
            })
        
        # Calculate KPIs
        conversion_rate = (current["won"] / current["total"] * 100) if current["total"] > 0 else 0
        prev_conversion_rate = (previous["won"] / (current["total"] if current["total"] > 0 else 1) * 100) if previous.get("won", 0) > 0 else 0
        
        result = {
            "success": True,
            "data": {
                "period": {
                    "start": start.isoformat(),
                    "end": end.isoformat(),
                    "label": period
                },
                "kpis": {
                    "totalRevenue": {
                        "value": current["totalValue"],
                        "previousValue": previous["totalValue"],
                        "change": current["totalValue"] - previous["totalValue"],
                        "changePercentage": calculate_change_percentage(current["totalValue"], previous["totalValue"])
                    },
                    "wonOpportunities": {
                        "value": current["won"],
                        "previousValue": previous["won"],
                        "change": current["won"] - previous["won"],
                        "changePercentage": calculate_change_percentage(current["won"], previous["won"])
                    },
                    "averageValue": {
                        "value": current.get("avgValue", 0) or 0,
                        "previousValue": 0,
                        "change": 0,
                        "changePercentage": 0
                    },
                    "conversionRate": {
                        "value": conversion_rate,
                        "previousValue": prev_conversion_rate,
                        "change": conversion_rate - prev_conversion_rate,
                        "changePercentage": 0
                    },
                    "totalSquareMeters": {
                        "value": current.get("totalSquareMeters", 0)
                    }
                },
                "currencyBreakdown": currency_breakdown,
                "proposalStats": proposal_stats,
                "monthlyTrend": monthly_trend,
                "recentWins": recent_wins
            }
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        print(f"❌ Sales summary error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Satış özeti alınırken hata: {str(e)}")


# ========================
# 2. PERFORMANS ANALİZİ
# ========================

@router.get("/performance")
async def get_performance_analysis(
    year: int = Query(datetime.now().year, description="Year for analysis"),
    quarter: Optional[int] = Query(None, description="Quarter (1-4)"),
    user_id: Optional[str] = Query(None, alias="userId"),
    db = Depends(get_db)
):
    """Get performance analysis with targets vs actuals"""
    try:
        # Year boundaries
        year_start = datetime(year, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        year_end = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        
        opportunities = db["opportunities"]
        
        # Quarterly results
        quarterly_results = []
        for q in range(1, 5):
            q_start = datetime(year, (q - 1) * 3 + 1, 1, 0, 0, 0, tzinfo=timezone.utc)
            end_month = q * 3
            if end_month == 12:
                q_end = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
            else:
                next_q_start = datetime(year, end_month + 1, 1, tzinfo=timezone.utc)
                q_end = next_q_start - timedelta(seconds=1)
            
            # Get actual revenue
            pipeline = [
                {
                    "$match": {
                        "createdAt": {"$gte": q_start, "$lte": q_end},
                        "status": {"$in": ["won", "kazanildi", "kazanıldı"]}
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "revenue": {"$sum": "$value"},
                        "count": {"$sum": 1}
                    }
                }
            ]
            
            result_cursor = opportunities.aggregate(pipeline)
            result_list = await result_cursor.to_list(length=1)
            actual = result_list[0]["revenue"] if result_list else 0
            
            # Mock target (in real app, get from targets collection)
            target = 400000  # €400K per quarter
            
            quarterly_results.append({
                "quarter": q,
                "quarterName": f"Q{q} {year}",
                "target": target,
                "actual": actual,
                "percentage": round((actual / target) * 100) if target > 0 else 0,
                "remaining": max(0, target - actual)
            })
        
        # Win/Loss stats
        win_loss_pipeline = [
            {
                "$match": {
                    "createdAt": {"$gte": year_start, "$lte": year_end},
                    "status": {"$in": ["won", "kazanildi", "kazanıldı", "lost", "kaybedildi"]}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "won": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["won", "kazanildi", "kazanıldı"]]},
                                1,
                                0
                            ]
                        }
                    },
                    "lost": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["lost", "kaybedildi"]]},
                                1,
                                0
                            ]
                        }
                    },
                    "wonValue": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["won", "kazanildi", "kazanıldı"]]},
                                "$value",
                                0
                            ]
                        }
                    },
                    "lostValue": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["lost", "kaybedildi"]]},
                                "$value",
                                0
                            ]
                        }
                    }
                }
            }
        ]
        
        wl_cursor = opportunities.aggregate(win_loss_pipeline)
        wl_list = await wl_cursor.to_list(length=1)
        wl = wl_list[0] if wl_list else {"won": 0, "lost": 0, "wonValue": 0, "lostValue": 0}
        
        win_rate = round((wl["won"] / (wl["won"] + wl["lost"])) * 100, 1) if (wl["won"] + wl["lost"]) > 0 else 0
        
        # Lost reasons
        lost_reasons_pipeline = [
            {
                "$match": {
                    "createdAt": {"$gte": year_start, "$lte": year_end},
                    "status": {"$in": ["lost", "kaybedildi"]},
                    "lostReason": {"$exists": True, "$ne": None, "$ne": ""}
                }
            },
            {
                "$group": {
                    "_id": "$lostReason",
                    "count": {"$sum": 1},
                    "totalValue": {"$sum": "$value"}
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        lr_cursor = opportunities.aggregate(lost_reasons_pipeline)
        lost_reasons_list = await lr_cursor.to_list(length=None)
        
        total_lost = sum(r["count"] for r in lost_reasons_list)
        lost_reasons = [
            {
                "reason": r["_id"],
                "count": r["count"],
                "totalValue": r["totalValue"],
                "percentage": round((r["count"] / total_lost) * 100) if total_lost > 0 else 0
            }
            for r in lost_reasons_list
        ]
        
        # Stand type performance
        stand_type_pipeline = [
            {
                "$match": {
                    "createdAt": {"$gte": year_start, "$lte": year_end}
                }
            },
            {
                "$group": {
                    "_id": "$standType",
                    "total": {"$sum": 1},
                    "won": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["won", "kazanildi", "kazanıldı"]]},
                                1,
                                0
                            ]
                        }
                    },
                    "totalValue": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["won", "kazanildi", "kazanıldı"]]},
                                "$value",
                                0
                            ]
                        }
                    },
                    "avgValue": {"$avg": "$value"},
                    "avgSize": {"$avg": "$squareMeters"}
                }
            },
            {"$sort": {"totalValue": -1}}
        ]
        
        st_cursor = opportunities.aggregate(stand_type_pipeline)
        stand_type_list = await st_cursor.to_list(length=None)
        
        total_stand_value = sum(s["totalValue"] for s in stand_type_list)
        
        stand_type_names = {
            "wooden": "Ahşap",
            "system": "Sistem",
            "mixed": "Karma"
        }
        
        stand_type_performance = [
            {
                "type": s["_id"] or "other",
                "typeName": stand_type_names.get(s["_id"], "Diğer"),
                "total": s["total"],
                "won": s["won"],
                "winRate": round((s["won"] / s["total"]) * 100) if s["total"] > 0 else 0,
                "totalValue": s["totalValue"],
                "avgValue": round(s.get("avgValue", 0) or 0),
                "avgSize": round(s.get("avgSize", 0) or 0),
                "percentage": round((s["totalValue"] / total_stand_value) * 100) if total_stand_value > 0 else 0
            }
            for s in stand_type_list
        ]
        
        result = {
            "success": True,
            "data": {
                "year": year,
                "quarterlyResults": quarterly_results,
                "yearlyTarget": sum(q["target"] for q in quarterly_results),
                "yearlyActual": sum(q["actual"] for q in quarterly_results),
                "winLoss": {
                    "won": wl["won"],
                    "lost": wl["lost"],
                    "winRate": win_rate,
                    "wonValue": wl["wonValue"],
                    "lostValue": wl["lostValue"]
                },
                "lostReasons": lost_reasons,
                "standTypePerformance": stand_type_performance
            }
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        print(f"❌ Performance analysis error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Performans analizi alınırken hata: {str(e)}")
