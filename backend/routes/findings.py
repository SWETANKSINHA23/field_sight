import logging
import json
from datetime import datetime
from typing import Optional, List, Dict

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from bson import ObjectId

from database.mongodb import get_findings_collection
from models.finding import FindingSubmitResponse, FindingAnalytics
from utils.auth import get_current_user
from utils.file_handler import save_notes_image, save_site_image, save_audio_file
from services.ocr_service import extract_text_from_image
from services.audio_service import transcribe_audio
from services.gemini_service import analyze_site_image, generate_final_analytics

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Field Findings"])


@router.post(
    "/post_findings",
    response_model=FindingSubmitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a field visit finding (staff only)",
)
async def post_findings(
    location: str = Form(...),
    date: str = Form(...),
    program_area: str = Form(...),
    stakeholders_met: str = Form(...),
    notes_image: Optional[UploadFile] = File(None),
    site_image: Optional[UploadFile] = File(None),
    audio_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    user_id: str = current_user["user_id"]
    service_errors: Dict[str, str] = {}

    stakeholders_list: List[str] = [
        s.strip() for s in stakeholders_met.split(",") if s.strip()
    ]

    logger.info(f"[STEP 1] Saving uploaded files for user {user_id}")

    notes_image_path: Optional[str] = None
    site_image_path: Optional[str] = None
    audio_file_path: Optional[str] = None

    try:
        if notes_image and notes_image.filename:
            notes_image_path = await save_notes_image(notes_image)
        if site_image and site_image.filename:
            site_image_path = await save_site_image(site_image)
        if audio_file and audio_file.filename:
            audio_file_path = await save_audio_file(audio_file)
    except IOError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File storage failed: {exc}",
        )

    logger.info("[STEP 2] Running OCR on notes image")
    ocr_text: str = ""
    if notes_image_path:
        ocr_text, ocr_err = await extract_text_from_image(notes_image_path)
        if ocr_err:
            service_errors["ocr"] = ocr_err
            logger.warning(f"[STEP 2] OCR failed: {ocr_err}")
    else:
        logger.info("No notes image provided; skipping OCR.")

    logger.info("[STEP 3] Running speech-to-text on audio file")
    audio_transcript: str = ""
    if audio_file_path:
        audio_transcript, audio_err = await transcribe_audio(audio_file_path)
        if audio_err:
            service_errors["audio"] = audio_err
            logger.warning(f"[STEP 3] Whisper failed: {audio_err}")
    else:
        logger.info("No audio file provided; skipping transcription.")

    logger.info("[STEP 4] Running Gemini site image analysis")
    site_image_analysis: str = ""
    if site_image_path:
        site_image_analysis, vision_err = await analyze_site_image(site_image_path)
        if vision_err:
            service_errors["gemini_vision"] = vision_err
            logger.warning(f"[STEP 4] Gemini Vision failed: {vision_err}")
    else:
        logger.info("No site image provided; skipping Gemini image analysis.")

    logger.info("[STEP 5] Building consolidated payload")
    consolidated_payload = {
        "location": location,
        "date": date,
        "program_area": program_area,
        "stakeholders_met": ", ".join(stakeholders_list),
        "ocr_text": ocr_text,
        "audio_transcript": audio_transcript,
        "site_image_analysis": site_image_analysis,
    }

    logger.info("[STEP 6] Generating Gemini analytics")
    analytics_dict: Optional[dict] = None
    analytics_dict, analytics_err = await generate_final_analytics(consolidated_payload)
    if analytics_err:
        service_errors["gemini_analytics"] = analytics_err
        logger.warning(f"[STEP 6] Gemini analytics failed: {analytics_err}")

    logger.info("[STEP 7] Storing finding in MongoDB")
    now = datetime.utcnow()

    finding_document = {
        "user_id": ObjectId(user_id),
        "location": location,
        "date": date,
        "program_area": program_area,
        "stakeholders_met": stakeholders_list,
        "notes_image_path": notes_image_path,
        "site_image_path": site_image_path,
        "audio_file_path": audio_file_path,
        "ocr_text": ocr_text,
        "audio_transcript": audio_transcript,
        "site_image_analysis": site_image_analysis,
        "summary": analytics_dict.get("summary") if analytics_dict else None,
        "key_findings": analytics_dict.get("key_findings") if analytics_dict else [],
        "blockers": analytics_dict.get("blockers") if analytics_dict else [],
        "follow_up": analytics_dict.get("follow_up") if analytics_dict else None,
        "follow_up_priority": analytics_dict.get("follow_up_priority") if analytics_dict else None,
        "sentiment": analytics_dict.get("sentiment") if analytics_dict else None,
        "issue_type": analytics_dict.get("issue_type") if analytics_dict else [],
        "issue_status": "open",
        "service_errors": service_errors if service_errors else None,
        "created_at": now,
        "updated_at": now,
    }

    findings_col = get_findings_collection()

    try:
        result = await findings_col.insert_one(finding_document)
        finding_id = str(result.inserted_id)
        logger.info(f"Finding stored: id={finding_id}, service_errors={list(service_errors.keys()) or 'none'}")
    except Exception as exc:
        logger.error(f"MongoDB insert failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store the finding in the database.",
        )

    logger.info("[STEP 8] Returning response")

    analytics_response: Optional[FindingAnalytics] = None
    if analytics_dict:
        try:
            analytics_response = FindingAnalytics(**analytics_dict)
        except Exception as exc:
            logger.warning(f"Could not parse analytics into model: {exc}")

    return FindingSubmitResponse(
        finding_id=finding_id,
        ocr_text=ocr_text,
        audio_transcript=audio_transcript,
        site_image_analysis=site_image_analysis,
        analytics=analytics_response,
        service_errors=service_errors if service_errors else None,
    )
