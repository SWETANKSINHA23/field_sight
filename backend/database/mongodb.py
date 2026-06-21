import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME: str = os.getenv("DB_NAME", "field_visit_db")

client: AsyncIOMotorClient = None  # type: ignore[assignment]
db = None


async def connect_to_mongo() -> None:
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        await client.admin.command("ping")
        db = client[DB_NAME]
        logger.info(f"Connected to MongoDB at '{MONGO_URI}', database='{DB_NAME}'")
    except Exception as exc:
        logger.error(f"Failed to connect to MongoDB: {exc}")
        raise exc


async def close_mongo_connection() -> None:
    global client
    if client is not None:
        client.close()
        logger.info("MongoDB connection closed.")


def get_users_collection():
    return db["users"]


def get_findings_collection():
    return db["findings"]