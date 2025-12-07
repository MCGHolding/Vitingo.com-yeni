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
        now_utc = datetime.now(timezone.utc)
        six_months_ago = now_utc - timedelta(days=180)
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



# ========================
# 3. SATIŞ HUNİSİ (PIPELINE)
# ========================

@router.get("/pipeline")
async def get_sales_pipeline(
    db = Depends(get_db)
):
    """Get sales pipeline funnel analysis"""
    try:
        opportunities = db["opportunities"]
        
        # Define funnel stages
        funnel_stages = [
            {
                "key": "lead",
                "statuses": ["lead", "yeni", "new"],
                "label": "Lead (İlk Temas)"
            },
            {
                "key": "qualified",
                "statuses": ["qualified", "nitelikli", "kvalifiye"],
                "label": "Nitelikli"
            },
            {
                "key": "proposal",
                "statuses": ["proposal", "teklif", "proposal_sent"],
                "label": "Teklif Aşaması"
            },
            {
                "key": "negotiation",
                "statuses": ["negotiation", "muzakere", "müzakere", "görüşme"],
                "label": "Müzakere"
            },
            {
                "key": "won",
                "statuses": ["won", "kazanildi", "kazanıldı", "closed_won"],
                "label": "Kazanıldı"
            }
        ]
        
        # Get data for each funnel stage
        funnel_data = []
        for stage in funnel_stages:
            pipeline = [
                {"$match": {"status": {"$in": stage["statuses"]}}},
                {
                    "$group": {
                        "_id": None,
                        "count": {"$sum": 1},
                        "value": {"$sum": "$value"}
                    }
                }
            ]
            
            cursor = opportunities.aggregate(pipeline)
            result_list = await cursor.to_list(length=1)
            result = result_list[0] if result_list else {"count": 0, "value": 0}
            
            funnel_data.append({
                "stage": stage["key"],
                "label": stage["label"],
                "count": result["count"],
                "value": result["value"]
            })
        
        # Calculate conversion rates
        conversion_rates = []
        for i in range(len(funnel_data) - 1):
            current = funnel_data[i]
            next_stage = funnel_data[i + 1]
            rate = round((next_stage["count"] / current["count"]) * 100) if current["count"] > 0 else 0
            
            conversion_rates.append({
                "from": current["stage"],
                "to": next_stage["stage"],
                "rate": rate,
                "passed": next_stage["count"]
            })
        
        # Overall conversion (lead to won)
        overall_conversion = round(
            (funnel_data[-1]["count"] / funnel_data[0]["count"]) * 100 * 10
        ) / 10 if funnel_data[0]["count"] > 0 else 0
        
        # Stage aging (average days in each stage)
        aging_pipeline = [
            {
                "$match": {
                    "status": {"$nin": ["won", "kazanildi", "kazanıldı", "lost", "kaybedildi"]}
                }
            },
            {
                "$project": {
                    "status": 1,
                    "daysInStage": {
                        "$divide": [
                            {"$subtract": [datetime.now(timezone.utc), "$updatedAt"]},
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": "$status",
                    "avgDays": {"$avg": "$daysInStage"},
                    "maxDays": {"$max": "$daysInStage"},
                    "count": {"$sum": 1}
                }
            }
        ]
        
        aging_cursor = opportunities.aggregate(aging_pipeline)
        aging_list = await aging_cursor.to_list(length=None)
        
        aging_data = [
            {
                "status": a["_id"],
                "avgDays": round(a["avgDays"]) if a.get("avgDays") is not None else 0,
                "maxDays": round(a["maxDays"]) if a.get("maxDays") is not None else 0,
                "count": a["count"]
            }
            for a in aging_list
        ]
        
        # Forecasted closes (by expected close date)
        now = datetime.now(timezone.utc)
        next_30_days = now + timedelta(days=30)
        next_60_days = now + timedelta(days=60)
        next_90_days = now + timedelta(days=90)
        
        forecast_pipeline = [
            {
                "$match": {
                    "status": {"$nin": ["won", "kazanildi", "kazanıldı", "lost", "kaybedildi"]},
                    "expectedCloseDate": {"$exists": True, "$ne": None}
                }
            },
            {
                "$project": {
                    "value": 1,
                    "probability": {"$ifNull": ["$probability", 50]},
                    "expectedCloseDate": 1,
                    "period": {
                        "$cond": [
                            {"$lte": ["$expectedCloseDate", next_30_days]},
                            "30_days",
                            {
                                "$cond": [
                                    {"$lte": ["$expectedCloseDate", next_60_days]},
                                    "60_days",
                                    {
                                        "$cond": [
                                            {"$lte": ["$expectedCloseDate", next_90_days]},
                                            "90_days",
                                            "beyond"
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": "$period",
                    "count": {"$sum": 1},
                    "totalValue": {"$sum": "$value"},
                    "weightedValue": {
                        "$sum": {
                            "$multiply": ["$value", {"$divide": ["$probability", 100]}]
                        }
                    }
                }
            }
        ]
        
        forecast_cursor = opportunities.aggregate(forecast_pipeline)
        forecast_list = await forecast_cursor.to_list(length=None)
        
        period_labels = {
            "30_days": "Bu Ay",
            "60_days": "30-60 Gün",
            "90_days": "60-90 Gün",
            "beyond": "90+ Gün"
        }
        
        closing_forecast = [
            {
                "period": c["_id"],
                "periodLabel": period_labels.get(c["_id"], "Diğer"),
                "count": c["count"],
                "totalValue": c["totalValue"],
                "weightedValue": round(c["weightedValue"])
            }
            for c in forecast_list
        ]
        
        # Total pipeline value
        pipeline_total_pipeline = [
            {
                "$match": {
                    "status": {"$nin": ["won", "kazanildi", "kazanıldı", "lost", "kaybedildi"]}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "totalValue": {"$sum": "$value"},
                    "weightedValue": {
                        "$sum": {
                            "$multiply": [
                                "$value",
                                {"$divide": [{"$ifNull": ["$probability", 50]}, 100]}
                            ]
                        }
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        
        pt_cursor = opportunities.aggregate(pipeline_total_pipeline)
        pt_list = await pt_cursor.to_list(length=1)
        pipeline_total = pt_list[0] if pt_list else {
            "totalValue": 0,
            "weightedValue": 0,
            "count": 0
        }
        
        result = {
            "success": True,
            "data": {
                "funnel": funnel_data,
                "conversionRates": conversion_rates,
                "overallConversion": overall_conversion,
                "aging": aging_data,
                "closingForecast": closing_forecast,
                "pipelineTotal": {
                    "count": pipeline_total["count"],
                    "totalValue": pipeline_total["totalValue"],
                    "weightedValue": round(pipeline_total.get("weightedValue", 0))
                }
            }
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        print(f"❌ Pipeline analysis error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Pipeline analizi alınırken hata: {str(e)}")


# ========================
# 4. FUAR BAZLI ANALİZ
# ========================

@router.get("/fairs")
async def get_fair_analysis(
    year: int = Query(datetime.now().year, description="Year for analysis"),
    limit: int = Query(10, description="Number of top fairs to return"),
    db = Depends(get_db)
):
    """Get fair-based analysis"""
    try:
        year_start = datetime(year, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        year_end = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        
        opportunities = db["opportunities"]
        fairs = db["fairs"]
        
        # Top fairs by revenue
        top_fairs_pipeline = [
            {
                "$match": {
                    "createdAt": {"$gte": year_start, "$lte": year_end},
                    "status": {"$in": ["won", "kazanildi", "kazanıldı"]},
                    "fairId": {"$exists": True, "$ne": None}
                }
            },
            {
                "$group": {
                    "_id": "$fairId",
                    "totalRevenue": {"$sum": "$value"},
                    "standCount": {"$sum": 1},
                    "totalSquareMeters": {"$sum": {"$ifNull": ["$squareMeters", 0]}},
                    "avgValue": {"$avg": "$value"}
                }
            },
            {"$sort": {"totalRevenue": -1}},
            {"$limit": limit}
        ]
        
        top_fairs_cursor = opportunities.aggregate(top_fairs_pipeline)
        top_fairs_list = await top_fairs_cursor.to_list(length=None)
        
        # Fetch fair details
        top_fairs = []
        for index, fair_data in enumerate(top_fairs_list):
            fair_id = fair_data["_id"]
            
            # Get fair details
            fair_doc = await fairs.find_one({"_id": fair_id}, {"_id": 0, "name": 1, "city": 1, "venue": 1})
            
            top_fairs.append({
                "rank": index + 1,
                "fairId": str(fair_id),
                "fairName": fair_doc.get("name", "Bilinmeyen Fuar") if fair_doc else "Bilinmeyen Fuar",
                "city": fair_doc.get("city", "-") if fair_doc else "-",
                "venue": fair_doc.get("venue", "-") if fair_doc else "-",
                "totalRevenue": fair_data["totalRevenue"],
                "standCount": fair_data["standCount"],
                "totalSquareMeters": fair_data["totalSquareMeters"],
                "avgValue": round(fair_data["avgValue"])
            })
        
        # Venue performance
        venue_pipeline = [
            {
                "$match": {
                    "createdAt": {"$gte": year_start, "$lte": year_end},
                    "status": {"$in": ["won", "kazanildi", "kazanıldı"]},
                    "fairId": {"$exists": True, "$ne": None}
                }
            },
            {
                "$lookup": {
                    "from": "fairs",
                    "localField": "fairId",
                    "foreignField": "_id",
                    "as": "fair"
                }
            },
            {"$unwind": {"path": "$fair", "preserveNullAndEmptyArrays": True}},
            {
                "$group": {
                    "_id": "$fair.venue",
                    "totalRevenue": {"$sum": "$value"},
                    "standCount": {"$sum": 1}
                }
            },
            {"$sort": {"totalRevenue": -1}},
            {"$limit": 10}
        ]
        
        venue_cursor = opportunities.aggregate(venue_pipeline)
        venue_list = await venue_cursor.to_list(length=None)
        
        total_venue_revenue = sum(v["totalRevenue"] for v in venue_list)
        
        venue_performance = [
            {
                "venue": v["_id"] if v["_id"] else "Belirtilmemiş",
                "totalRevenue": v["totalRevenue"],
                "standCount": v["standCount"],
                "percentage": round((v["totalRevenue"] / total_venue_revenue) * 100) if total_venue_revenue > 0 else 0
            }
            for v in venue_list
        ]
        
        # Monthly calendar (fairs and sales by month)
        monthly_calendar_pipeline = [
            {
                "$match": {
                    "createdAt": {"$gte": year_start, "$lte": year_end},
                    "status": {"$in": ["won", "kazanildi", "kazanıldı"]}
                }
            },
            {
                "$group": {
                    "_id": {"$month": "$createdAt"},
                    "revenue": {"$sum": "$value"},
                    "count": {"$sum": 1},
                    "fairIds": {"$addToSet": "$fairId"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        mc_cursor = opportunities.aggregate(monthly_calendar_pipeline)
        mc_list = await mc_cursor.to_list(length=None)
        
        month_names = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ]
        
        monthly_calendar = [
            {
                "month": m["_id"],
                "monthName": month_names[m["_id"] - 1],
                "revenue": m["revenue"],
                "standCount": m["count"],
                "fairCount": len([f for f in m.get("fairIds", []) if f is not None])
            }
            for m in mc_list
        ]
        
        result = {
            "success": True,
            "data": {
                "year": year,
                "topFairs": top_fairs,
                "venuePerformance": venue_performance,
                "monthlyCalendar": monthly_calendar
            }
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        print(f"❌ Fair analysis error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Fuar analizi alınırken hata: {str(e)}")


# Single fair detail endpoint
@router.get("/fairs/{fair_id}")
async def get_fair_detail(
    fair_id: str,
    db = Depends(get_db)
):
    """Get detailed analysis for a single fair"""
    try:
        opportunities = db["opportunities"]
        fairs = db["fairs"]
        
        # Convert to ObjectId
        try:
            fair_obj_id = ObjectId(fair_id)
        except:
            raise HTTPException(status_code=400, detail="Geçersiz fuar ID")
        
        # Get fair details
        fair = await fairs.find_one({"_id": fair_obj_id})
        if not fair:
            raise HTTPException(status_code=404, detail="Fuar bulunamadı")
        
        # Get fair statistics
        stats_pipeline = [
            {"$match": {"fairId": fair_obj_id}},
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
                    "totalRevenue": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["won", "kazanildi", "kazanıldı"]]},
                                "$value",
                                0
                            ]
                        }
                    },
                    "totalSquareMeters": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["won", "kazanildi", "kazanıldı"]]},
                                {"$ifNull": ["$squareMeters", 0]},
                                0
                            ]
                        }
                    },
                    "avgValue": {"$avg": "$value"},
                    "avgSize": {"$avg": "$squareMeters"},
                    "maxSize": {"$max": "$squareMeters"}
                }
            }
        ]
        
        stats_cursor = opportunities.aggregate(stats_pipeline)
        stats_list = await stats_cursor.to_list(length=1)
        s = stats_list[0] if stats_list else {}
        
        # Get customers
        customers_cursor = opportunities.find(
            {
                "fairId": fair_obj_id,
                "status": {"$in": ["won", "kazanildi", "kazanıldı"]}
            }
        ).limit(20)
        
        customers_list = await customers_cursor.to_list(length=20)
        
        customers = []
        for opp in customers_list:
            customer_name = opp.get("customerName", "Bilinmeyen")
            if opp.get("customerId"):
                try:
                    customer_doc = await db["customers"].find_one(
                        {"_id": ObjectId(opp["customerId"])},
                        {"_id": 0, "companyName": 1}
                    )
                    if customer_doc:
                        customer_name = customer_doc.get("companyName", customer_name)
                except:
                    pass
            
            customers.append({
                "id": str(opp.get("customerId", opp.get("_id"))),
                "name": customer_name,
                "value": opp.get("value", 0),
                "squareMeters": opp.get("squareMeters", 0)
            })
        
        result = {
            "success": True,
            "data": {
                "fair": {
                    "id": str(fair["_id"]),
                    "name": fair.get("name", ""),
                    "city": fair.get("city", ""),
                    "venue": fair.get("venue", ""),
                    "startDate": fair.get("startDate").isoformat() if fair.get("startDate") else None,
                    "endDate": fair.get("endDate").isoformat() if fair.get("endDate") else None,
                    "sector": fair.get("sector", "")
                },
                "stats": {
                    "totalProposals": s.get("total", 0),
                    "wonProposals": s.get("won", 0),
                    "winRate": round((s.get("won", 0) / s.get("total", 1)) * 100) if s.get("total", 0) > 0 else 0,
                    "totalRevenue": s.get("totalRevenue", 0),
                    "totalSquareMeters": s.get("totalSquareMeters", 0),
                    "avgValue": round(s.get("avgValue", 0) or 0),
                    "avgSize": round(s.get("avgSize", 0) or 0),
                    "maxSize": s.get("maxSize", 0)
                },
                "customers": customers
            }
        }
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Fair detail error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Fuar detayı alınırken hata: {str(e)}")




# ========================
# 5. MÜŞTERİ ANALİZİ
# ========================

@router.get("/customers")
async def get_customer_analysis(
    period: str = Query('this_year', description="Period for analysis"),
    start_date: Optional[str] = Query(None, alias="startDate"),
    end_date: Optional[str] = Query(None, alias="endDate"),
    db = Depends(get_db)
):
    """Get customer analysis with RFM segmentation"""
    try:
        date_range = get_date_range(period, start_date, end_date)
        start, end = date_range['start'], date_range['end']
        
        opportunities = db["opportunities"]
        customers_collection = db["customers"]
        
        # Get customer statistics from won opportunities
        customer_stats_pipeline = [
            {
                "$match": {
                    "status": {"$in": ["won", "kazanildi", "kazanıldı"]},
                    "customerId": {"$exists": True, "$ne": None}
                }
            },
            {
                "$group": {
                    "_id": "$customerId",
                    "totalRevenue": {"$sum": "$value"},
                    "projectCount": {"$sum": 1},
                    "lastPurchase": {"$max": "$updatedAt"},
                    "firstPurchase": {"$min": "$createdAt"},
                    "avgValue": {"$avg": "$value"}
                }
            }
        ]
        
        stats_cursor = opportunities.aggregate(customer_stats_pipeline)
        customer_stats = await stats_cursor.to_list(length=None)
        
        # Fetch customer details and create RFM segments
        now = datetime.now(timezone.utc)
        segments = {
            "vip": {"customers": [], "totalRevenue": 0, "label": "💎 VIP", "criteria": "Yıllık 3+ proje, €50K+"},
            "loyal": {"customers": [], "totalRevenue": 0, "label": "⭐ Sadık", "criteria": "Yıllık 2 proje, düzenli"},
            "growing": {"customers": [], "totalRevenue": 0, "label": "🌱 Büyüyen", "criteria": "Yıllık 1 proje, potansiyel"},
            "sleeping": {"customers": [], "totalRevenue": 0, "label": "😴 Uyuyan", "criteria": "6+ ay işlem yok"}
        }
        
        for c in customer_stats:
            # Get customer details
            customer = await customers_collection.find_one(
                {"_id": c["_id"]},
                {"_id": 0, "companyName": 1, "country": 1}
            )
            
            customer_name = customer.get("companyName", "Bilinmeyen") if customer else "Bilinmeyen"
            customer_country = customer.get("country", "-") if customer else "-"
            
            # Calculate metrics
            days_since_last = (now - c["lastPurchase"]).days if c.get("lastPurchase") else 999
            days_since_first = (now - c["firstPurchase"]).days if c.get("firstPurchase") else 1
            avg_projects_per_year = (c["projectCount"] / max(1, days_since_first / 365.25))
            
            # Segment assignment
            segment_key = None
            if avg_projects_per_year >= 3 and c["totalRevenue"] >= 50000:
                segment_key = "vip"
            elif avg_projects_per_year >= 2 or c["totalRevenue"] >= 30000:
                segment_key = "loyal"
            elif days_since_last > 180:
                segment_key = "sleeping"
            else:
                segment_key = "growing"
            
            customer_data = {
                "id": str(c["_id"]),
                "name": customer_name,
                "country": customer_country,
                "totalRevenue": c["totalRevenue"],
                "projectCount": c["projectCount"],
                "lastPurchase": c["lastPurchase"].isoformat() if c.get("lastPurchase") else None,
                "avgValue": round(c.get("avgValue", 0) or 0),
                "daysSinceLastPurchase": days_since_last
            }
            
            segments[segment_key]["customers"].append(customer_data)
            segments[segment_key]["totalRevenue"] += c["totalRevenue"]
        
        # Format segments
        segment_summary = []
        for key, value in segments.items():
            segment_summary.append({
                "key": key,
                "label": value["label"],
                "criteria": value["criteria"],
                "customerCount": len(value["customers"]),
                "totalRevenue": value["totalRevenue"],
                "avgRevenue": round(value["totalRevenue"] / len(value["customers"])) if len(value["customers"]) > 0 else 0
            })
        
        # Sector distribution
        sector_pipeline = [
            {
                "$match": {
                    "sector": {"$exists": True, "$ne": None, "$ne": ""}
                }
            },
            {
                "$lookup": {
                    "from": "opportunities",
                    "localField": "_id",
                    "foreignField": "customerId",
                    "as": "opportunities"
                }
            },
            {
                "$project": {
                    "sector": 1,
                    "revenue": {
                        "$sum": {
                            "$map": {
                                "input": {
                                    "$filter": {
                                        "input": "$opportunities",
                                        "as": "opp",
                                        "cond": {"$in": ["$$opp.status", ["won", "kazanildi", "kazanıldı"]]}
                                    }
                                },
                                "as": "wonOpp",
                                "in": "$$wonOpp.value"
                            }
                        }
                    }
                }
            },
            {
                "$group": {
                    "_id": "$sector",
                    "count": {"$sum": 1},
                    "totalRevenue": {"$sum": "$revenue"}
                }
            },
            {"$sort": {"totalRevenue": -1}}
        ]
        
        sector_cursor = customers_collection.aggregate(sector_pipeline)
        sector_list = await sector_cursor.to_list(length=None)
        
        total_sector_revenue = sum(s["totalRevenue"] for s in sector_list)
        sector_distribution = [
            {
                "sector": s["_id"],
                "count": s["count"],
                "totalRevenue": s["totalRevenue"],
                "percentage": round((s["totalRevenue"] / total_sector_revenue) * 100) if total_sector_revenue > 0 else 0
            }
            for s in sector_list
        ]
        
        # Top customers
        top_customers = sorted(customer_stats, key=lambda x: x["totalRevenue"], reverse=True)[:10]
        
        top_customers_list = []
        for index, c in enumerate(top_customers):
            customer = await customers_collection.find_one(
                {"_id": c["_id"]},
                {"_id": 0, "companyName": 1, "country": 1}
            )
            
            days_since_last = (now - c["lastPurchase"]).days if c.get("lastPurchase") else 0
            
            top_customers_list.append({
                "rank": index + 1,
                "id": str(c["_id"]),
                "name": customer.get("companyName", "Bilinmeyen") if customer else "Bilinmeyen",
                "country": customer.get("country", "-") if customer else "-",
                "projectCount": c["projectCount"],
                "totalRevenue": c["totalRevenue"],
                "lastPurchase": c["lastPurchase"].isoformat() if c.get("lastPurchase") else None,
                "daysSinceLastPurchase": days_since_last
            })
        
        # New vs returning customers (current year)
        current_year_start = datetime(now.year, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        
        new_vs_returning_pipeline = [
            {
                "$match": {
                    "status": {"$in": ["won", "kazanildi", "kazanıldı"]},
                    "createdAt": {"$gte": current_year_start}
                }
            },
            {
                "$lookup": {
                    "from": "opportunities",
                    "let": {"custId": "$customerId", "currDate": "$createdAt"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        {"$eq": ["$customerId", "$$custId"]},
                                        {"$lt": ["$createdAt", "$$currDate"]},
                                        {"$in": ["$status", ["won", "kazanildi", "kazanıldı"]]}
                                    ]
                                }
                            }
                        }
                    ],
                    "as": "previousOrders"
                }
            },
            {
                "$project": {
                    "value": 1,
                    "isNewCustomer": {"$eq": [{"$size": "$previousOrders"}, 0]}
                }
            },
            {
                "$group": {
                    "_id": "$isNewCustomer",
                    "count": {"$sum": 1},
                    "revenue": {"$sum": "$value"}
                }
            }
        ]
        
        nvr_cursor = opportunities.aggregate(new_vs_returning_pipeline)
        nvr_list = await nvr_cursor.to_list(length=None)
        
        new_customer_data = next((n for n in nvr_list if n["_id"] == True), {"count": 0, "revenue": 0})
        returning_customer_data = next((n for n in nvr_list if n["_id"] == False), {"count": 0, "revenue": 0})
        
        total_customers = new_customer_data["count"] + returning_customer_data["count"]
        
        # CLV distribution
        clv_ranges = [
            {"min": 50000, "max": float('inf'), "label": "Yüksek (€50K+)"},
            {"min": 20000, "max": 50000, "label": "Orta (€20-50K)"},
            {"min": 5000, "max": 20000, "label": "Düşük (€5-20K)"},
            {"min": 0, "max": 5000, "label": "Yeni (<€5K)"}
        ]
        
        clv_distribution = []
        for range_item in clv_ranges:
            customers_in_range = [
                c for c in customer_stats 
                if c["totalRevenue"] >= range_item["min"] and c["totalRevenue"] < range_item["max"]
            ]
            clv_distribution.append({
                "label": range_item["label"],
                "count": len(customers_in_range),
                "totalRevenue": sum(c["totalRevenue"] for c in customers_in_range),
                "percentage": round((len(customers_in_range) / len(customer_stats)) * 100) if len(customer_stats) > 0 else 0
            })
        
        avg_clv = round(sum(c["totalRevenue"] for c in customer_stats) / len(customer_stats)) if len(customer_stats) > 0 else 0
        
        result = {
            "success": True,
            "data": {
                "segments": segment_summary,
                "sectorDistribution": sector_distribution,
                "topCustomers": top_customers_list,
                "newVsReturning": {
                    "new": {
                        "count": new_customer_data["count"],
                        "revenue": new_customer_data["revenue"],
                        "percentage": round((new_customer_data["count"] / total_customers) * 100) if total_customers > 0 else 0
                    },
                    "returning": {
                        "count": returning_customer_data["count"],
                        "revenue": returning_customer_data["revenue"],
                        "percentage": round((returning_customer_data["count"] / total_customers) * 100) if total_customers > 0 else 0
                    }
                },
                "clvDistribution": clv_distribution,
                "avgCLV": avg_clv,
                "totalCustomers": len(customer_stats)
            }
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        print(f"❌ Customer analysis error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Müşteri analizi alınırken hata: {str(e)}")


# ========================
# 6. GELİR TAHMİNLERİ
# ========================

@router.get("/forecast")
async def get_revenue_forecast(
    year: int = Query(datetime.now().year, description="Year for forecast"),
    db = Depends(get_db)
):
    """Get revenue forecast with monthly projections"""
    try:
        now = datetime.now(timezone.utc)
        current_month = now.month
        
        opportunities = db["opportunities"]
        
        # Get monthly actuals
        monthly_actual_pipeline = [
            {
                "$match": {
                    "createdAt": {
                        "$gte": datetime(year, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
                        "$lte": datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
                    },
                    "status": {"$in": ["won", "kazanildi", "kazanıldı"]}
                }
            },
            {
                "$group": {
                    "_id": {"$month": "$createdAt"},
                    "revenue": {"$sum": "$value"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        ma_cursor = opportunities.aggregate(monthly_actual_pipeline)
        monthly_actual_list = await ma_cursor.to_list(length=None)
        
        # Monthly projections
        monthly_projection = []
        cumulative_actual = 0
        
        # Mock targets (in production, fetch from SalesTarget collection)
        yearly_target = 4500000  # €4.5M
        monthly_target = round(yearly_target / 12)
        
        for month in range(1, 13):
            actual_data = next((m for m in monthly_actual_list if m["_id"] == month), None)
            is_actual = month <= current_month and year == now.year
            
            if is_actual and actual_data:
                revenue = actual_data["revenue"]
                cumulative_actual += revenue
                projected = None
            else:
                # Simple projection: average of previous months
                avg_monthly = cumulative_actual / current_month if current_month > 0 else monthly_target
                projected = round(avg_monthly)
                revenue = None
            
            month_names = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
            
            monthly_projection.append({
                "month": month,
                "monthName": month_names[month - 1],
                "actual": revenue,
                "projected": projected,
                "target": monthly_target,
                "isActual": is_actual
            })
        
        # Year end projection
        projected_year_end = cumulative_actual + sum(
            m["projected"] for m in monthly_projection if m["projected"] is not None
        )
        target_achievement = round((projected_year_end / yearly_target) * 100) if yearly_target > 0 else 0
        
        # Pipeline forecast by probability
        pipeline_forecast_pipeline = [
            {
                "$match": {
                    "status": {"$nin": ["won", "kazanildi", "kazanıldı", "lost", "kaybedildi"]}
                }
            },
            {
                "$project": {
                    "value": 1,
                    "probability": {"$ifNull": ["$probability", 50]},
                    "probabilityCategory": {
                        "$cond": [
                            {"$gte": ["$probability", 70]},
                            "high",
                            {
                                "$cond": [
                                    {"$gte": ["$probability", 40]},
                                    "medium",
                                    "low"
                                ]
                            }
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": "$probabilityCategory",
                    "count": {"$sum": 1},
                    "totalValue": {"$sum": "$value"},
                    "weightedValue": {
                        "$sum": {"$multiply": ["$value", {"$divide": ["$probability", 100]}]}
                    }
                }
            }
        ]
        
        pf_cursor = opportunities.aggregate(pipeline_forecast_pipeline)
        pf_list = await pf_cursor.to_list(length=None)
        
        forecast_by_probability = {
            "high": next((p for p in pf_list if p["_id"] == "high"), {"count": 0, "totalValue": 0, "weightedValue": 0}),
            "medium": next((p for p in pf_list if p["_id"] == "medium"), {"count": 0, "totalValue": 0, "weightedValue": 0}),
            "low": next((p for p in pf_list if p["_id"] == "low"), {"count": 0, "totalValue": 0, "weightedValue": 0})
        }
        
        total_weighted_forecast = sum(p["weightedValue"] for p in pf_list)
        
        # Upcoming closes (30 days)
        thirty_days_later = now + timedelta(days=30)
        
        upcoming_cursor = opportunities.find({
            "status": {"$nin": ["won", "kazanildi", "kazanıldı", "lost", "kaybedildi"]},
            "expectedCloseDate": {
                "$gte": now,
                "$lte": thirty_days_later
            }
        }).sort("expectedCloseDate", 1).limit(10)
        
        upcoming_list = await upcoming_cursor.to_list(length=10)
        
        upcoming_closes = []
        for opp in upcoming_list:
            customer_name = opp.get("customerName", "Bilinmeyen")
            if opp.get("customerId"):
                try:
                    customer = await db["customers"].find_one(
                        {"_id": ObjectId(opp["customerId"])},
                        {"_id": 0, "companyName": 1}
                    )
                    if customer:
                        customer_name = customer.get("companyName", customer_name)
                except:
                    pass
            
            fair_name = opp.get("fairName", "-")
            if opp.get("fairId"):
                try:
                    fair = await db["fairs"].find_one(
                        {"_id": ObjectId(opp["fairId"])},
                        {"_id": 0, "name": 1}
                    )
                    if fair:
                        fair_name = fair.get("name", fair_name)
                except:
                    pass
            
            days_until = (opp.get("expectedCloseDate") - now).days if opp.get("expectedCloseDate") else 0
            
            upcoming_closes.append({
                "customerName": customer_name,
                "title": opp.get("title", ""),
                "fairName": fair_name,
                "value": opp.get("value", 0),
                "currency": opp.get("currency", "EUR"),
                "probability": opp.get("probability", 50),
                "expectedCloseDate": opp.get("expectedCloseDate").isoformat() if opp.get("expectedCloseDate") else None,
                "daysUntil": days_until
            })
        
        # Calculate 30-day forecast
        thirty_day_forecast = sum(
            opp["value"] * (opp["probability"] / 100)
            for opp in upcoming_closes
        )
        
        result = {
            "success": True,
            "data": {
                "year": year,
                "monthlyProjection": monthly_projection,
                "yearSummary": {
                    "yearlyTarget": yearly_target,
                    "projectedYearEnd": round(projected_year_end),
                    "targetAchievement": target_achievement,
                    "currentActual": cumulative_actual,
                    "remaining": max(0, yearly_target - cumulative_actual)
                },
                "pipelineForecast": {
                    "high": {
                        "label": "Yüksek (>70%)",
                        "count": forecast_by_probability["high"]["count"],
                        "totalValue": forecast_by_probability["high"]["totalValue"],
                        "weightedValue": round(forecast_by_probability["high"]["weightedValue"])
                    },
                    "medium": {
                        "label": "Orta (40-70%)",
                        "count": forecast_by_probability["medium"]["count"],
                        "totalValue": forecast_by_probability["medium"]["totalValue"],
                        "weightedValue": round(forecast_by_probability["medium"]["weightedValue"])
                    },
                    "low": {
                        "label": "Düşük (<40%)",
                        "count": forecast_by_probability["low"]["count"],
                        "totalValue": forecast_by_probability["low"]["totalValue"],
                        "weightedValue": round(forecast_by_probability["low"]["weightedValue"])
                    },
                    "totalWeighted": round(total_weighted_forecast)
                },
                "upcomingCloses": upcoming_closes,
                "thirtyDayForecast": round(thirty_day_forecast)
            }
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        print(f"❌ Forecast error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Gelir tahmini alınırken hata: {str(e)}")


@router.get("/period-comparison")
async def get_period_comparison(
    comparison_type: str = Query("year_over_year", description="Type: year_over_year, quarter_over_quarter, month_over_month"),
    year: int = Query(datetime.now().year, description="Base year"),
    db = Depends(get_db)
):
    """Get period-over-period comparison analysis"""
    try:
        proposals = db["proposals"]
        opportunities = db["opportunities"]
        
        current_year = year
        previous_year = year - 1
        
        # Helper function to get period data
        async def get_year_data(target_year):
            start_date = datetime(target_year, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
            end_date = datetime(target_year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
            
            # Revenue from won proposals
            revenue_pipeline = [
                {
                    "$match": {
                        "createdAt": {"$gte": start_date, "$lte": end_date},
                        "status": {"$in": ["accepted", "kazanildi", "kazanıldı"]}
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "totalRevenue": {"$sum": "$totalAmount"},
                        "count": {"$sum": 1},
                        "avgValue": {"$avg": "$totalAmount"}
                    }
                }
            ]
            
            revenue_cursor = proposals.aggregate(revenue_pipeline)
            revenue_data = await revenue_cursor.to_list(length=1)
            revenue_summary = revenue_data[0] if revenue_data else {"totalRevenue": 0, "count": 0, "avgValue": 0}
            
            # Opportunities data
            opp_pipeline = [
                {
                    "$match": {
                        "createdAt": {"$gte": start_date, "$lte": end_date}
                    }
                },
                {
                    "$group": {
                        "_id": "$status",
                        "count": {"$sum": 1},
                        "totalValue": {"$sum": "$value"}
                    }
                }
            ]
            
            opp_cursor = opportunities.aggregate(opp_pipeline)
            opp_data = await opp_cursor.to_list(length=None)
            
            won_count = sum(o["count"] for o in opp_data if o["_id"] in ["won", "kazanildi", "kazanıldı"])
            lost_count = sum(o["count"] for o in opp_data if o["_id"] in ["lost", "kaybedildi"])
            total_opps = sum(o["count"] for o in opp_data)
            
            return {
                "revenue": revenue_summary.get("totalRevenue", 0),
                "deals": revenue_summary.get("count", 0),
                "avgDealSize": revenue_summary.get("avgValue", 0),
                "opportunities": total_opps,
                "wonOpportunities": won_count,
                "lostOpportunities": lost_count,
                "winRate": round((won_count / total_opps * 100) if total_opps > 0 else 0, 1)
            }
        
        # Get data for both periods
        current_data = await get_year_data(current_year)
        previous_data = await get_year_data(previous_year)
        
        # Calculate changes
        def calculate_change(current, previous):
            if previous == 0:
                return 100 if current > 0 else 0
            return round(((current - previous) / previous) * 100, 1)
        
        comparison = {
            "revenue": {
                "current": current_data["revenue"],
                "previous": previous_data["revenue"],
                "change": calculate_change(current_data["revenue"], previous_data["revenue"]),
                "changeAmount": current_data["revenue"] - previous_data["revenue"]
            },
            "deals": {
                "current": current_data["deals"],
                "previous": previous_data["deals"],
                "change": calculate_change(current_data["deals"], previous_data["deals"]),
                "changeAmount": current_data["deals"] - previous_data["deals"]
            },
            "avgDealSize": {
                "current": current_data["avgDealSize"],
                "previous": previous_data["avgDealSize"],
                "change": calculate_change(current_data["avgDealSize"], previous_data["avgDealSize"]),
                "changeAmount": current_data["avgDealSize"] - previous_data["avgDealSize"]
            },
            "opportunities": {
                "current": current_data["opportunities"],
                "previous": previous_data["opportunities"],
                "change": calculate_change(current_data["opportunities"], previous_data["opportunities"]),
                "changeAmount": current_data["opportunities"] - previous_data["opportunities"]
            },
            "winRate": {
                "current": current_data["winRate"],
                "previous": previous_data["winRate"],
                "change": current_data["winRate"] - previous_data["winRate"],
                "changeAmount": current_data["winRate"] - previous_data["winRate"]
            }
        }
        
        # Monthly breakdown
        monthly_comparison = []
        month_names = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                       'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
        
        for month in range(1, 13):
            month_start_current = datetime(current_year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
            month_start_previous = datetime(previous_year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
            
            if month == 12:
                month_end_current = datetime(current_year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
                month_end_previous = datetime(previous_year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
            else:
                month_end_current = datetime(current_year, month + 1, 1, 0, 0, 0, tzinfo=timezone.utc) - timedelta(seconds=1)
                month_end_previous = datetime(previous_year, month + 1, 1, 0, 0, 0, tzinfo=timezone.utc) - timedelta(seconds=1)
            
            # Current month data
            current_month_cursor = proposals.aggregate([
                {
                    "$match": {
                        "createdAt": {"$gte": month_start_current, "$lte": month_end_current},
                        "status": {"$in": ["accepted", "kazanildi", "kazanıldı"]}
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "revenue": {"$sum": "$totalAmount"},
                        "count": {"$sum": 1}
                    }
                }
            ])
            current_month_data = await current_month_cursor.to_list(length=1)
            current_revenue = current_month_data[0]["revenue"] if current_month_data else 0
            current_count = current_month_data[0]["count"] if current_month_data else 0
            
            # Previous month data
            previous_month_cursor = proposals.aggregate([
                {
                    "$match": {
                        "createdAt": {"$gte": month_start_previous, "$lte": month_end_previous},
                        "status": {"$in": ["accepted", "kazanildi", "kazanıldı"]}
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "revenue": {"$sum": "$totalAmount"},
                        "count": {"$sum": 1}
                    }
                }
            ])
            previous_month_data = await previous_month_cursor.to_list(length=1)
            previous_revenue = previous_month_data[0]["revenue"] if previous_month_data else 0
            previous_count = previous_month_data[0]["count"] if previous_month_data else 0
            
            monthly_comparison.append({
                "month": month,
                "monthName": month_names[month - 1],
                "current": {
                    "revenue": current_revenue,
                    "deals": current_count
                },
                "previous": {
                    "revenue": previous_revenue,
                    "deals": previous_count
                },
                "change": calculate_change(current_revenue, previous_revenue)
            })
        
        result = {
            "success": True,
            "data": {
                "comparisonType": comparison_type,
                "currentPeriod": f"{current_year}",
                "previousPeriod": f"{previous_year}",
                "summary": comparison,
                "monthlyComparison": monthly_comparison
            }
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        print(f"❌ Period comparison error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Dönemsel karşılaştırma alınırken hata: {str(e)}")


@router.get("/user-performance")
async def get_user_performance(
    period: str = Query("this_year", description="Period: this_month, this_quarter, this_year"),
    db = Depends(get_db)
):
    """Get sales performance by user/salesperson"""
    try:
        start_date, end_date = get_date_range(period)
        
        proposals = db["proposals"]
        opportunities = db["opportunities"]
        
        # Get user performance from proposals
        user_pipeline = [
            {
                "$match": {
                    "createdAt": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$createdBy",
                    "totalProposals": {"$sum": 1},
                    "acceptedProposals": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["accepted", "kazanildi", "kazanıldı"]]},
                                1,
                                0
                            ]
                        }
                    },
                    "totalRevenue": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["accepted", "kazanildi", "kazanıldı"]]},
                                "$totalAmount",
                                0
                            ]
                        }
                    },
                    "avgDealSize": {
                        "$avg": {
                            "$cond": [
                                {"$in": ["$status", ["accepted", "kazanildi", "kazanıldı"]]},
                                "$totalAmount",
                                None
                            ]
                        }
                    }
                }
            },
            {"$sort": {"totalRevenue": -1}}
        ]
        
        user_cursor = proposals.aggregate(user_pipeline)
        user_list = await user_cursor.to_list(length=None)
        
        # Enrich with user details
        users_collection = db["users"]
        user_performance = []
        
        for user_data in user_list:
            user_id = user_data["_id"]
            
            # Get user details
            user_doc = await users_collection.find_one({"id": user_id}, {"_id": 0})
            
            if not user_doc:
                user_doc = {"name": "Bilinmeyen Kullanıcı", "email": ""}
            
            total_proposals = user_data["totalProposals"]
            accepted = user_data["acceptedProposals"]
            win_rate = round((accepted / total_proposals * 100) if total_proposals > 0 else 0, 1)
            
            # Get opportunities for this user
            opp_count = await opportunities.count_documents({
                "assignedTo": user_id,
                "createdAt": {"$gte": start_date, "$lte": end_date}
            })
            
            user_performance.append({
                "userId": user_id,
                "userName": user_doc.get("name", "Bilinmeyen"),
                "email": user_doc.get("email", ""),
                "department": user_doc.get("department", "Satış"),
                "totalProposals": total_proposals,
                "acceptedProposals": accepted,
                "rejectedProposals": total_proposals - accepted,
                "totalRevenue": user_data["totalRevenue"],
                "avgDealSize": user_data["avgDealSize"] or 0,
                "winRate": win_rate,
                "opportunities": opp_count,
                "performance": "Mükemmel" if win_rate >= 80 else "İyi" if win_rate >= 60 else "Orta" if win_rate >= 40 else "Geliştirilmeli"
            })
        
        # Calculate team summary
        total_team_revenue = sum(u["totalRevenue"] for u in user_performance)
        total_team_deals = sum(u["acceptedProposals"] for u in user_performance)
        avg_team_win_rate = sum(u["winRate"] for u in user_performance) / len(user_performance) if user_performance else 0
        
        # Top performers
        top_by_revenue = sorted(user_performance, key=lambda x: x["totalRevenue"], reverse=True)[:5]
        top_by_deals = sorted(user_performance, key=lambda x: x["acceptedProposals"], reverse=True)[:5]
        top_by_win_rate = sorted(user_performance, key=lambda x: x["winRate"], reverse=True)[:5]
        
        result = {
            "success": True,
            "data": {
                "period": period,
                "teamSummary": {
                    "totalRevenue": total_team_revenue,
                    "totalDeals": total_team_deals,
                    "avgWinRate": round(avg_team_win_rate, 1),
                    "activeUsers": len(user_performance)
                },
                "userPerformance": user_performance,
                "topPerformers": {
                    "byRevenue": top_by_revenue,
                    "byDeals": top_by_deals,
                    "byWinRate": top_by_win_rate
                }
            }
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        print(f"❌ User performance error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Kullanıcı performansı alınırken hata: {str(e)}")

            upcoming_closes.append({
                "id": str(opp.get("_id")),
                "name": opp.get("name") or opp.get("projectName", "-"),
                "customerName": customer_name,
                "fairName": fair_name,
                "value": opp.get("value", 0),
                "probability": opp.get("probability", 50),
                "expectedCloseDate": opp.get("expectedCloseDate").isoformat() if opp.get("expectedCloseDate") else None,
                "daysUntilClose": max(0, days_until)
            })
        
        thirty_day_forecast = sum(
            opp["value"] * (opp["probability"] / 100)
            for opp in upcoming_closes
        )
        
        result = {
            "success": True,
            "data": {
                "year": year,
                "monthlyProjection": monthly_projection,
                "yearSummary": {
                    "yearlyTarget": yearly_target,
                    "projectedYearEnd": round(projected_year_end),
                    "targetAchievement": target_achievement,
                    "currentActual": cumulative_actual,
                    "remaining": max(0, yearly_target - cumulative_actual)
                },
                "pipelineForecast": {
                    "high": {
                        "label": "Yüksek (>70%)",
                        "count": forecast_by_probability["high"]["count"],
                        "totalValue": forecast_by_probability["high"]["totalValue"],
                        "weightedValue": round(forecast_by_probability["high"]["weightedValue"])
                    },
                    "medium": {
                        "label": "Orta (40-70%)",
                        "count": forecast_by_probability["medium"]["count"],
                        "totalValue": forecast_by_probability["medium"]["totalValue"],
                        "weightedValue": round(forecast_by_probability["medium"]["weightedValue"])
                    },
                    "low": {
                        "label": "Düşük (<40%)",
                        "count": forecast_by_probability["low"]["count"],
                        "totalValue": forecast_by_probability["low"]["totalValue"],
                        "weightedValue": round(forecast_by_probability["low"]["weightedValue"])
                    },
                    "totalWeighted": round(total_weighted_forecast)
                },
                "upcomingCloses": upcoming_closes,
                "thirtyDayForecast": round(thirty_day_forecast)
            }
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        print(f"❌ Forecast error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Gelir tahmini alınırken hata: {str(e)}")

