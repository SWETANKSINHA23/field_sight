import logging
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from bson import ObjectId

from database.mongodb import get_findings_collection, get_users_collection
from utils.auth import get_current_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    if "user_id" in doc and not isinstance(doc["user_id"], str):
        doc["user_id"] = str(doc["user_id"])
    for key in ("created_at", "updated_at"):
        if key in doc and hasattr(doc[key], "isoformat"):
            doc[key] = doc[key].isoformat()
    return doc


def _build_query(locations: List[str], start_date: Optional[str], end_date: Optional[str]) -> dict:
    query: dict = {}
    if locations:
        query["location"] = {"$in": locations}
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["date"] = {"$gte": start_date}
    elif end_date:
        query["date"] = {"$lte": end_date}
    return query


@router.get("/users")
async def list_users(admin: dict = Depends(get_current_admin)):
    col = get_users_collection()
    users = await col.find({}, {"password_hash": 0}).to_list(1000)
    result = []
    for u in users:
        u["id"] = str(u.pop("_id"))
        if "created_at" in u and hasattr(u["created_at"], "isoformat"):
            u["created_at"] = u["created_at"].isoformat()
        result.append(u)
    return result


@router.get("/users/{user_id}/reports")
async def get_user_reports(user_id: str, admin: dict = Depends(get_current_admin)):
    col = get_findings_collection()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id format.")
    reports = await col.find({"user_id": oid}).sort("created_at", -1).to_list(500)
    return [_serialize(r) for r in reports]


@router.get("/reports/{report_id}")
async def get_report_detail(report_id: str, admin: dict = Depends(get_current_admin)):
    col = get_findings_collection()
    try:
        oid = ObjectId(report_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid report_id format.")
    report = await col.find_one({"_id": oid})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return _serialize(report)


@router.get("/analytics/locations")
async def get_locations(admin: dict = Depends(get_current_admin)):
    col = get_findings_collection()
    locations = await col.distinct("location")
    return sorted([l for l in locations if l])


@router.get("/analytics/kpis")
async def get_kpis(
    locations: List[str] = Query(default=[]),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    admin: dict = Depends(get_current_admin),
):
    col = get_findings_collection()
    query = _build_query(locations, start_date, end_date)

    total = await col.count_documents(query)
    unique_locs = await col.distinct("location", query)
    active_regions = len(unique_locs)
    open_issues = await col.count_documents({**query, "issue_status": "open"})
    critical_issues = await col.count_documents({**query, "follow_up_priority": "critical"})

    sentiment_agg = await col.aggregate([
        {"$match": query},
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}}
    ]).to_list(10)
    sentiment_map = {s["_id"]: s["count"] for s in sentiment_agg if s["_id"]}
    positive_pct = round(sentiment_map.get("positive", 0) / total * 100, 1) if total > 0 else 0

    return {
        "total_visits": total,
        "active_regions": active_regions,
        "open_issues": open_issues,
        "critical_issues": critical_issues,
        "positive_sentiment_pct": positive_pct,
        "sentiment_distribution": sentiment_map,
    }


@router.get("/analytics/issue-types")
async def get_issue_types(
    locations: List[str] = Query(default=[]),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    admin: dict = Depends(get_current_admin),
):
    col = get_findings_collection()
    query = _build_query(locations, start_date, end_date)
    pipeline = [
        {"$match": query},
        {"$unwind": {"path": "$issue_type", "preserveNullAndEmptyArrays": False}},
        {"$group": {"_id": "$issue_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    result = await col.aggregate(pipeline).to_list(50)
    return [{"issue_type": r["_id"], "count": r["count"]} for r in result if r["_id"]]


@router.get("/analytics/sentiment")
async def get_sentiment(
    locations: List[str] = Query(default=[]),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    admin: dict = Depends(get_current_admin),
):
    col = get_findings_collection()
    query = _build_query(locations, start_date, end_date)
    pipeline = [
        {"$match": query},
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}},
    ]
    result = await col.aggregate(pipeline).to_list(10)
    return [{"sentiment": r["_id"], "count": r["count"]} for r in result if r["_id"]]


@router.get("/analytics/trends")
async def get_trends(
    locations: List[str] = Query(default=[]),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    granularity: str = Query(default="daily"),
    admin: dict = Depends(get_current_admin),
):
    col = get_findings_collection()
    query = _build_query(locations, start_date, end_date)

    if granularity == "monthly":
        date_expr = {"$substr": ["$date", 0, 7]}
    elif granularity == "weekly":
        date_expr = {
            "$concat": [
                {"$toString": {"$isoWeekYear": {"$dateFromString": {"dateString": "$date"}}}},
                "-W",
                {
                    "$cond": [
                        {"$lte": [{"$isoWeek": {"$dateFromString": {"dateString": "$date"}}}, 9]},
                        {"$concat": ["0", {"$toString": {"$isoWeek": {"$dateFromString": {"dateString": "$date"}}}}]},
                        {"$toString": {"$isoWeek": {"$dateFromString": {"dateString": "$date"}}}},
                    ]
                },
            ]
        }
    else:
        date_expr = "$date"

    pipeline = [
        {"$match": query},
        {"$group": {"_id": date_expr, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    result = await col.aggregate(pipeline).to_list(500)
    return [{"date": r["_id"], "count": r["count"]} for r in result if r["_id"]]


@router.get("/analytics/stakeholders")
async def get_stakeholders(
    locations: List[str] = Query(default=[]),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    admin: dict = Depends(get_current_admin),
):
    col = get_findings_collection()
    query = _build_query(locations, start_date, end_date)
    pipeline = [
        {"$match": query},
        {"$unwind": {"path": "$stakeholders_met", "preserveNullAndEmptyArrays": False}},
        {"$group": {"_id": "$stakeholders_met", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    result = await col.aggregate(pipeline).to_list(50)
    return [{"stakeholder": r["_id"], "count": r["count"]} for r in result if r["_id"]]


@router.get("/analytics/follow-up-priority")
async def get_follow_up_priority(
    locations: List[str] = Query(default=[]),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    admin: dict = Depends(get_current_admin),
):
    col = get_findings_collection()
    query = _build_query(locations, start_date, end_date)
    pipeline = [
        {"$match": query},
        {"$group": {"_id": "$follow_up_priority", "count": {"$sum": 1}}},
    ]
    result = await col.aggregate(pipeline).to_list(10)
    return [{"priority": r["_id"], "count": r["count"]} for r in result if r["_id"]]
