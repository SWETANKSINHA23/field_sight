import os
import json
import time
import logging
from typing import Optional, Tuple

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from google.api_core.exceptions import ResourceExhausted
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY is not set. Gemini calls will fail at runtime.")

genai.configure(api_key=GEMINI_API_KEY)

SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}

VISION_MODEL_NAME = "gemini-2.5-flash-lite"
TEXT_MODEL_NAME = "gemini-2.5-flash-lite"


async def analyze_site_image(image_path: str) -> Tuple[str, Optional[str]]:
    try:
        image = Image.open(image_path)

        model = genai.GenerativeModel(
            model_name=VISION_MODEL_NAME,
            safety_settings=SAFETY_SETTINGS,
        )

        prompt = (
            "You are an expert field analyst reviewing a site photograph submitted "
            "by a development-sector field officer. Carefully examine this image and "
            "provide a detailed, structured analysis covering all of the following "
            "dimensions where evidence is visible:\n\n"
            "1. Infrastructure: roads, buildings, facilities, electricity, sanitation\n"
            "2. Environment: land use, vegetation, water bodies, erosion, pollution\n"
            "3. Education indicators: schools, classrooms, learning materials, attendance\n"
            "4. Healthcare indicators: clinics, medicine availability, hygiene\n"
            "5. Agriculture indicators: crops, irrigation, farm tools, storage\n"
            "6. Water indicators: access to clean water, wells, pipelines\n"
            "7. Livelihood indicators: markets, small enterprises, economic activity\n"
            "8. Visible problems: damage, overcrowding, neglect, safety hazards\n\n"
            "Be factual and concise. If a dimension is not visible, state 'Not visible'."
        )

        max_retries = 4
        for attempt in range(max_retries):
            try:
                response = model.generate_content([prompt, image])
                analysis: str = response.text.strip()
                logger.info(f"Site image analysis complete for '{image_path}': {len(analysis)} characters.")
                return analysis, None

            except ResourceExhausted as rate_err:
                wait = (2 ** attempt) * 15
                logger.warning(f"Gemini rate limit hit (attempt {attempt + 1}/{max_retries}). Waiting {wait}s... Error: {rate_err}")
                if attempt < max_retries - 1:
                    time.sleep(wait)
                else:
                    msg = "Gemini Vision API rate limit exceeded after 4 retries"
                    logger.error(f"Gemini image analysis exhausted all retries: {image_path}")
                    return "", msg

    except FileNotFoundError:
        msg = f"Site image not found at '{image_path}'"
        logger.error(msg)
        return "", msg

    except Exception as exc:
        msg = f"Gemini Vision analysis failed: {type(exc).__name__}: {exc}"
        logger.error(f"Gemini image analysis failed for '{image_path}': {exc}")
        return "", msg


async def generate_final_analytics(payload: dict) -> Tuple[Optional[dict], Optional[str]]:
    try:
        model = genai.GenerativeModel(
            model_name=TEXT_MODEL_NAME,
            safety_settings=SAFETY_SETTINGS,
        )

        prompt = f"""
You are a senior field-monitoring analyst. Based on the consolidated field-visit data below,
generate a structured analytics report.

=== FIELD VISIT DATA ===
Location: {payload.get("location", "unknown")}
Date: {payload.get("date", "unknown")}
Program Area: {payload.get("program_area", "unknown")}
Stakeholders Met: {payload.get("stakeholders_met", "unknown")}

OCR Text from Notes:
{payload.get("ocr_text", "No OCR text available.")}

Audio Transcript:
{payload.get("audio_transcript", "No audio transcript available.")}

Site Image Analysis:
{payload.get("site_image_analysis", "No site image analysis available.")}

=== OUTPUT RULES ===
- Output MUST be valid JSON.
- Do NOT wrap the response in markdown code fences.
- Do NOT include explanations or comments.
- All keys are mandatory.
- Use only the allowed enum values listed below.
- If information is unavailable or unclear, use "unknown".

Return EXACTLY this JSON structure:
{{
  "summary": "<string: overall summary of the visit>",
  "key_findings": ["<string>", "..."],
  "blockers": ["<string>", "..."],
  "follow_up": "<string: recommended follow-up action>",
  "follow_up_priority": "<one of: critical | high | medium | low>",
  "sentiment": "<one of: positive | neutral | negative>",
  "issue_type": ["<one or more of: transport | teacher_shortage | water_scarcity | internet_connectivity | agriculture | waste_management | healthcare | infrastructure | livelihood | other>"]
}}
"""

        max_retries = 4
        for attempt in range(max_retries):
            try:
                response = model.generate_content(prompt)
                raw_text: str = response.text.strip()

                if raw_text.startswith("```"):
                    raw_text = raw_text.split("```")[1]
                    if raw_text.startswith("json"):
                        raw_text = raw_text[4:]
                    raw_text = raw_text.strip()

                analytics: dict = json.loads(raw_text)
                logger.info("Gemini analytics generation successful.")
                return analytics, None

            except ResourceExhausted as rate_err:
                wait = (2 ** attempt) * 15
                logger.warning(f"Gemini rate limit hit (attempt {attempt + 1}/{max_retries}). Waiting {wait}s... Error: {rate_err}")
                if attempt < max_retries - 1:
                    time.sleep(wait)
                else:
                    msg = "Gemini Analytics API rate limit exceeded after 4 retries"
                    logger.error("Gemini analytics generation exhausted all retries.")
                    return None, msg

            except json.JSONDecodeError as exc:
                msg = f"Gemini returned malformed JSON: {exc}"
                logger.error(f"Gemini returned non-JSON response: {exc}")
                return None, msg

    except Exception as exc:
        msg = f"Gemini analytics generation failed: {type(exc).__name__}: {exc}"
        logger.error(f"Gemini analytics generation failed: {exc}")
        return None, msg