import os
import asyncio
import logging
import traceback
from typing import Optional, Tuple

import easyocr

logger = logging.getLogger(__name__)

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_reader: Optional[easyocr.Reader] = None


def _get_reader() -> easyocr.Reader:
    global _reader
    if _reader is None:
        logger.info("Initialising EasyOCR reader (first-time model load)...")
        _reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        logger.info("EasyOCR reader ready.")
    return _reader


def _run_ocr(image_path: str) -> str:
    reader = _get_reader()
    results = reader.readtext(image_path, detail=0)
    return " ".join(results).strip()


async def extract_text_from_image(image_path: str) -> Tuple[str, Optional[str]]:
    if not os.path.isabs(image_path):
        image_path = os.path.join(BACKEND_DIR, image_path)

    logger.info(f"OCR starting on: {image_path}")

    if not os.path.exists(image_path):
        msg = f"Notes image not found at path '{image_path}'"
        logger.error(f"OCR failed: {msg}")
        return "", msg

    try:
        extracted_text = await asyncio.to_thread(_run_ocr, image_path)
        logger.info(f"OCR complete: {len(extracted_text)} characters extracted.")
        return extracted_text, None

    except Exception as exc:
        msg = f"EasyOCR failed: {type(exc).__name__}: {exc}"
        logger.error(f"OCR failed for '{image_path}': {exc}")
        logger.error(traceback.format_exc())
        return "", msg