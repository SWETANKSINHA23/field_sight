from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict
from datetime import datetime


class FindingAnalytics(BaseModel):
    summary: str
    key_findings: List[str]
    blockers: List[str]
    follow_up: str
    follow_up_priority: Literal["critical", "high", "medium", "low"]
    sentiment: Literal["positive", "neutral", "negative"]
    issue_type: List[
        Literal[
            "transport",
            "teacher_shortage",
            "water_scarcity",
            "internet_connectivity",
            "agriculture",
            "waste_management",
            "healthcare",
            "infrastructure",
            "livelihood",
            "other",
        ]
    ]


class FindingSubmitResponse(BaseModel):
    finding_id: str
    ocr_text: Optional[str]
    audio_transcript: Optional[str]
    site_image_analysis: Optional[str]
    analytics: Optional[FindingAnalytics]
    service_errors: Optional[Dict[str, str]] = None