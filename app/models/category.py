"""Category schemas."""
from pydantic import BaseModel
from typing import Optional


class CategoryCreate(BaseModel):
    name: str
    color: Optional[str] = ""
    icon: Optional[str] = ""
    description: Optional[str] = ""
    default_margin_pct: Optional[float] = 20.0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    default_margin_pct: Optional[float] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    color: str = ""
    icon: str = ""
    description: str = ""
    default_margin_pct: float = 20.0
