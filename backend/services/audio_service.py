import os
import asyncio
import logging
import traceback
from typing import Optional, Tuple

import whisper

logger = logging.getLogger(__name__)

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

WHISPER_MODEL_SIZE: str = "base"

_model: Optional[whisper.Whisper] = None


def _get_model() -> whisper.Whisper:
    global _model
    if _model is None:
        logger.info(f"Loading Whisper model '{WHISPER_MODEL_SIZE}'…")
        _model = whisper.load_model(WHISPER_MODEL_SIZE)
        logger.info("Whisper model loaded and ready.")
    return _model


def _run_transcribe(audio_path: str) -> str:
    model = _get_model()
    result = model.transcribe(audio_path, fp16=False)
    return result.get("text", "").strip()


async def transcribe_audio(audio_path: str) -> Tuple[str, Optional[str]]:
    if not os.path.isabs(audio_path):
        audio_path = os.path.join(BACKEND_DIR, audio_path)

    logger.info(f"Whisper transcription starting on: {audio_path}")

    if not os.path.exists(audio_path):
        msg = f"Audio file not found at path '{audio_path}'"
        logger.error(f"Transcription failed: {msg}")
        return "", msg

    try:
        transcript = await asyncio.to_thread(_run_transcribe, audio_path)
        logger.info(f"Transcription complete: {len(transcript)} characters.")
        return transcript, None

    except Exception as exc:
        msg = f"Whisper transcription failed: {type(exc).__name__}: {exc}"
        logger.error(f"Transcription failed for '{audio_path}': {exc}")
        logger.error(traceback.format_exc())
        return "", msg