from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class AttendanceBase(BaseModel):
    user_id: int
    user_name: Optional[str] = None
    date: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    hours_worked: float = 0
    overtime_hours: float = 0
    status: str = "present"
    notes: Optional[str] = None
    branch_id: int = 1

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    check_out: Optional[str] = None
    hours_worked: Optional[float] = None
    overtime_hours: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class Attendance(AttendanceBase):
    id: int
    created_at: str

    model_config = ConfigDict(from_attributes=True)

class AttendanceFilter(BaseModel):
    user_id: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    branch_id: Optional[int] = None
