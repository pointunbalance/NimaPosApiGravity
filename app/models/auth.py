"""Auth schemas — login, token, user info."""
from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    pin: str = Field(..., description="User secret PIN", examples=["1234"])
    branch_id: int = Field(1, description="Target branch ID")


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool = True
    created_at: Optional[str] = None


class LoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    expires_in: Optional[int] = None
    user: Optional[UserOut] = None


class TokenPayload(BaseModel):
    user_id: int
    username: str
    role: str
    branch_id: int
