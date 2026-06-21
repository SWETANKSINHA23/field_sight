import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database.mongodb import connect_to_mongo, close_mongo_connection
from routes.auth import router as auth_router
from routes.findings import router as findings_router
from routes.dashboard import router as dashboard_router
from routes.admin import router as admin_router

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

UPLOAD_DIRS = [
    os.getenv("NOTES_UPLOAD_DIR", "uploads/notes"),
    os.getenv("SITES_UPLOAD_DIR", "uploads/sites"),
    os.getenv("AUDIO_UPLOAD_DIR", "uploads/audio"),
]


def create_upload_directories() -> None:
    for directory in UPLOAD_DIRS:
        os.makedirs(directory, exist_ok=True)
        logger.info(f"Upload directory ready: {directory}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Field Visit Monitoring System…")
    create_upload_directories()
    await connect_to_mongo()
    logger.info("Application startup complete. Ready to accept requests.")
    yield
    logger.info("Shutting down Field Visit Monitoring System…")
    await close_mongo_connection()
    logger.info("Shutdown complete.")


app = FastAPI(
    title="Field Visit Monitoring and Analytics System",
    description=(
        "API for field staff to submit visit observations "
        "and for managers to access analytics dashboards."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(findings_router)
app.include_router(dashboard_router)
app.include_router(admin_router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "service": "Field Visit Monitoring and Analytics System",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
