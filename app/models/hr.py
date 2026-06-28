from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# ── Job Postings ──
class JobPostingBase(BaseModel):
    title: str
    department: str
    description: Optional[str] = ""
    requirements: Optional[str] = ""
    status: str = "open"  # open, closed, paused

class JobPostingCreate(JobPostingBase):
    pass

class JobPostingOut(JobPostingBase):
    id: int
    created_at: str
    closed_at: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# ── Applicants ──
class ApplicantBase(BaseModel):
    job_id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    status: str = "applied"  # applied, screening, interviewing, offered, hired, rejected

class ApplicantCreate(ApplicantBase):
    pass

class ApplicantStatusUpdate(BaseModel):
    status: str

class ApplicantOut(ApplicantBase):
    id: int
    applied_at: str
    model_config = ConfigDict(from_attributes=True)

# ── Interviews ──
class InterviewCreate(BaseModel):
    applicant_id: int
    interviewer_id: int
    scheduled_at: str
    status: str = "scheduled"

class InterviewFeedback(BaseModel):
    feedback: str
    rating: int  # 1 to 5
    status: str = "completed"

class InterviewOut(BaseModel):
    id: int
    applicant_id: int
    interviewer_id: int
    scheduled_at: str
    feedback: Optional[str] = None
    rating: Optional[int] = None
    status: str
    created_at: str
    model_config = ConfigDict(from_attributes=True)
