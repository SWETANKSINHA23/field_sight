import logging
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from bson import ObjectId
from bson.errors import InvalidId

from database.mongodb import get_findings_collection
from utils.auth import get_current_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _serialise_finding(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    if "user_id" in doc and isinstance(doc["user_id"], ObjectId):
        doc["user_id"] = str(doc["user_id"])
    return doc


@router.get("/findings", status_code=status.HTTP_200_OK)
async def get_all_findings(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    _admin: dict = Depends(get_current_admin),
):
    findings_col = get_findings_collection()
    query: dict = {}

    if start_date or end_date:
        date_filter: dict = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        query["date"] = date_filter

    try:
        cursor = findings_col.find(query).sort("created_at", -1)
        findings: List[dict] = [_serialise_finding(doc) async for doc in cursor]
        logger.info(f"Dashboard: returned {len(findings)} findings (start_date={start_date}, end_date={end_date})")
        return {"total": len(findings), "findings": findings}
    except Exception as exc:
        logger.error(f"Error fetching findings: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve findings.",
        )


@router.get("/finding/{finding_id}", status_code=status.HTTP_200_OK)
async def get_finding_by_id(
    finding_id: str,
    _admin: dict = Depends(get_current_admin),
):
    findings_col = get_findings_collection()
    try:
        object_id = ObjectId(finding_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{finding_id}' is not a valid finding ID.",
        )
    try:
        finding = await findings_col.find_one({"_id": object_id})
    except Exception as exc:
        logger.error(f"Error fetching finding {finding_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve the finding.",
        )
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Finding with id '{finding_id}' not found.",
        )
    return _serialise_finding(finding)


@router.get("/staff/{user_id}", status_code=status.HTTP_200_OK)
async def get_findings_by_staff(
    user_id: str,
    _admin: dict = Depends(get_current_admin),
):
    findings_col = get_findings_collection()
    try:
        staff_object_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{user_id}' is not a valid user ID.",
        )
    try:
        cursor = findings_col.find({"user_id": staff_object_id}).sort("created_at", -1)
        findings: List[dict] = [_serialise_finding(doc) async for doc in cursor]
        logger.info(f"Dashboard: returned {len(findings)} findings for staff user_id={user_id}")
        return {"staff_user_id": user_id, "total": len(findings), "findings": findings}
    except Exception as exc:
        logger.error(f"Error fetching findings for staff {user_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve findings for this staff member.",
        )
