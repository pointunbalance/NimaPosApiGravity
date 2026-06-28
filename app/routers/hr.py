"""HR Recruitment & Talent Management API Router."""
from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.models.hr import (
    JobPostingCreate, JobPostingOut, 
    ApplicantCreate, ApplicantOut, ApplicantStatusUpdate,
    InterviewCreate, InterviewFeedback, InterviewOut
)
from app.repositories import hr_repo
from app.middleware.auth_middleware import get_current_user
from app.models.common import ApiResponse

router = APIRouter(prefix="/hr", tags=["HR & Recruitment"])

# ── Job Postings ──
@router.post("/jobs", response_model=ApiResponse)
def create_job_posting(data: JobPostingCreate, user=Depends(get_current_user)):
    try:
        job_id = hr_repo.create_job_posting(data.model_dump())
        return ApiResponse(success=True, message="Job posting created successfully", data={"id": job_id})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/jobs", response_model=ApiResponse)
def list_job_postings(status: str = None, user=Depends(get_current_user)):
    try:
        jobs = hr_repo.get_job_postings(status)
        return ApiResponse(success=True, data={"jobs": jobs})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ── Applicants ──
@router.post("/applicants", response_model=ApiResponse)
def submit_applicant(data: ApplicantCreate, user=Depends(get_current_user)):
    try:
        applicant_id = hr_repo.create_applicant(data.model_dump())
        return ApiResponse(success=True, message="Applicant profile submitted", data={"id": applicant_id})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/jobs/{job_id}/applicants", response_model=ApiResponse)
def list_applicants(job_id: int, user=Depends(get_current_user)):
    try:
        applicants = hr_repo.get_applicants_by_job(job_id)
        return ApiResponse(success=True, data={"applicants": applicants})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/applicants/{applicant_id}/status", response_model=ApiResponse)
def change_applicant_status(applicant_id: int, data: ApplicantStatusUpdate, user=Depends(get_current_user)):
    try:
        success = hr_repo.update_applicant_status(applicant_id, data.status)
        if not success:
            raise ValueError("Applicant not found")
        return ApiResponse(success=True, message=f"Applicant status updated to {data.status}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ── Interviews ──
@router.post("/interviews", response_model=ApiResponse)
def schedule_interview(data: InterviewCreate, user=Depends(get_current_user)):
    try:
        interview_id = hr_repo.schedule_interview(data.model_dump())
        return ApiResponse(success=True, message="Interview scheduled successfully", data={"id": interview_id})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/applicants/{applicant_id}/interviews", response_model=ApiResponse)
def list_interviews(applicant_id: int, user=Depends(get_current_user)):
    try:
        interviews = hr_repo.get_interviews_by_applicant(applicant_id)
        return ApiResponse(success=True, data={"interviews": interviews})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/interviews/{interview_id}/feedback", response_model=ApiResponse)
def log_interview_feedback(interview_id: int, data: InterviewFeedback, user=Depends(get_current_user)):
    try:
        success = hr_repo.log_interview_feedback(interview_id, data.model_dump())
        if not success:
            raise ValueError("Interview not found")
        return ApiResponse(success=True, message="Interview feedback submitted")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
