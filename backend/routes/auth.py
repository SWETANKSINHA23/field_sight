import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pymongo.errors import DuplicateKeyError

from database.mongodb import get_users_collection
from models.user import (
    UserSignupRequest,
    UserSignupResponse,
    UserLoginRequest,
    UserLoginResponse,
)
from utils.auth import hash_password, verify_password, create_access_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserSignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserSignupRequest):
    users_col = get_users_collection()

    if await users_col.find_one({"email": payload.email}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")

    if await users_col.find_one({"username": payload.username}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken.")

    user_document = {
        "username": payload.username,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "role": payload.role,
        "created_at": datetime.utcnow(),
    }

    try:
        result = await users_col.insert_one(user_document)
        new_user_id = str(result.inserted_id)
        logger.info(f"New user created: id={new_user_id}, email={payload.email}, role={payload.role}")
        return UserSignupResponse(message="User created successfully", user_id=new_user_id)

    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Duplicate key violation.")

    except Exception as exc:
        logger.error(f"Signup failed for {payload.email}: {exc}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User creation failed.")


@router.post("/login", response_model=UserLoginResponse, status_code=status.HTTP_200_OK)
async def login(payload: UserLoginRequest):
    users_col = get_users_collection()
    user = await users_col.find_one({"email": payload.email})

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    token_data = {"sub": str(user["_id"]), "role": user["role"]}
    access_token = create_access_token(data=token_data)

    logger.info(f"User logged in: id={user['_id']}, role={user['role']}")

    return UserLoginResponse(access_token=access_token, token_type="bearer", role=user["role"])