"""User management schemas."""
from pydantic import BaseModel, Field
from typing import Optional


class UserCreate(BaseModel):
    username: str = Field(..., min_length=2)
    pin: str = Field(..., min_length=4, max_length=8)
    role: str = Field("cashier", description="'owner', 'manager', or 'cashier'")


class UserUpdate(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class ResetPinRequest(BaseModel):
    new_pin: str = Field(..., min_length=4, max_length=8)


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool = True
    created_at: Optional[str] = None


class EmployeeFileCreate(BaseModel):
    file_name: str
    file_type: str
    file_path: Optional[str] = ""
