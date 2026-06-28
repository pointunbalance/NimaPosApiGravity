"""Team member schemas."""
from pydantic import BaseModel
from typing import Optional


class TeamMemberCreate(BaseModel):
    name: str
    role: str # المصور، مساعد، مونتير
    phone: str
    email: Optional[str] = None
    notes: Optional[str] = None

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None # active | inactive
