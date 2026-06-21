from pydantic import BaseModel, EmailStr, Field
from typing import Literal
from datetime import datetime


class UserSignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Literal["staff", "admin"] = "staff"


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserSignupResponse(BaseModel):
    message: str
    user_id: str


class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Literal["staff", "admin"]