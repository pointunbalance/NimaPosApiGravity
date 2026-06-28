"""Branch schemas."""
from pydantic import BaseModel, Field
from typing import Optional


class BranchCreate(BaseModel):
    code: str = Field(..., description="Unique branch code")
    name: str = Field(..., description="Branch name")


class BranchUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class BranchOut(BaseModel):
    id: int
    code: str
    name: str
    is_active: bool = True
    created_at: Optional[str] = None
