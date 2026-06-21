import os
import uuid
import aiofiles
import logging
from fastapi import UploadFile

logger = logging.getLogger(__name__)

NOTES_DIR: str = os.getenv("NOTES_UPLOAD_DIR", "uploads/notes")
SITES_DIR: str = os.getenv("SITES_UPLOAD_DIR", "uploads/sites")
AUDIO_DIR: str = os.getenv("AUDIO_UPLOAD_DIR", "uploads/audio")


def _ensure_directory(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _unique_filename(original_filename: str) -> str:
    ext = os.path.splitext(original_filename)[-1].lower()
    return f"{uuid.uuid4().hex}{ext}"


async def save_notes_image(file: UploadFile) -> str:
    _ensure_directory(NOTES_DIR)
    filename = _unique_filename(file.filename or "notes_image.jpg")
    file_path = os.path.join(NOTES_DIR, filename)
    try:
        contents = await file.read()
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(contents)
        logger.info(f"Notes image saved: {file_path}")
        return file_path
    except Exception as exc:
        logger.error(f"Failed to save notes image: {exc}")
        raise IOError(f"Could not save notes image: {exc}") from exc
    finally:
        await file.seek(0)


async def save_site_image(file: UploadFile) -> str:
    _ensure_directory(SITES_DIR)
    filename = _unique_filename(file.filename or "site_image.jpg")
    file_path = os.path.join(SITES_DIR, filename)
    try:
        contents = await file.read()
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(contents)
        logger.info(f"Site image saved: {file_path}")
        return file_path
    except Exception as exc:
        logger.error(f"Failed to save site image: {exc}")
        raise IOError(f"Could not save site image: {exc}") from exc
    finally:
        await file.seek(0)


async def save_audio_file(file: UploadFile) -> str:
    _ensure_directory(AUDIO_DIR)
    filename = _unique_filename(file.filename or "audio.wav")
    file_path = os.path.join(AUDIO_DIR, filename)
    try:
        contents = await file.read()
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(contents)
        logger.info(f"Audio file saved: {file_path}")
        return file_path
    except Exception as exc:
        logger.error(f"Failed to save audio file: {exc}")
        raise IOError(f"Could not save audio file: {exc}") from exc
    finally:
        await file.seek(0)