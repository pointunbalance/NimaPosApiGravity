"""Pydantic models for Logbook (Activity Logs)."""
from pydantic import BaseModel
from typing import Optional


class LogCreate(BaseModel):
    type: str = "system"  # sale|refund|purchase|payment|expense|adjustment|shift|customer|user|system
    action: str
    details: Optional[str] = ""
    user_name: str = "system"
    amount: Optional[float] = None
    reference_id: Optional[int] = None
    status: str = "success"  # success | error | warning


class LogFilter(BaseModel):
    type: Optional[str] = None
    status: Optional[str] = None
    user_name: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    search: Optional[str] = None
