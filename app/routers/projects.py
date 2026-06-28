"""Projects and Costing API Router."""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any

from app.models.project import (
    ProjectCreate, ProjectOut, WBSTaskCreate, WBSTaskOut,
    TimesheetLogCreate, TimesheetLogOut, MaterialConsumptionCreate,
    MaterialConsumptionOut, CostingSummaryOut
)
from app.repositories import project_repo
from app.middleware.auth_middleware import get_current_user
from app.models.common import ApiResponse

router = APIRouter(prefix="/projects", tags=["Project Costing & WBS"])

@router.post("/", response_model=ApiResponse)
def create_project(data: ProjectCreate, user=Depends(get_current_user)):
    try:
        project_id = project_repo.create_project(data.model_dump())
        return ApiResponse(success=True, message="Project created successfully", data={"id": project_id})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=ApiResponse)
def list_projects(status: str = None, offset: int = 0, limit: int = 50, user=Depends(get_current_user)):
    try:
        projects, total = project_repo.get_projects(status, offset, limit)
        return ApiResponse(success=True, data={"projects": projects, "total": total})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{project_id}/wbs", response_model=ApiResponse)
def add_wbs_task(project_id: int, data: WBSTaskCreate, user=Depends(get_current_user)):
    try:
        task_id = project_repo.add_wbs_task(project_id, data.model_dump())
        return ApiResponse(success=True, message="WBS task deployed successfully", data={"id": task_id})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{project_id}/wbs", response_model=ApiResponse)
def list_wbs_tasks(project_id: int, user=Depends(get_current_user)):
    try:
        tasks = project_repo.get_wbs_tasks(project_id)
        return ApiResponse(success=True, data={"tasks": tasks})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{project_id}/timesheets", response_model=ApiResponse)
def log_timesheet(project_id: int, data: TimesheetLogCreate, user=Depends(get_current_user)):
    try:
        # Default to current user if no employee submitted
        data_dict = data.model_dump()
        if not data_dict.get("employee_id"):
            data_dict["employee_id"] = user["id"]
        
        entry_id = project_repo.log_timesheet(project_id, data_dict)
        return ApiResponse(success=True, message="Timesheet hours logged successfully", data={"id": entry_id})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{project_id}/materials", response_model=ApiResponse)
def consume_material(project_id: int, data: MaterialConsumptionCreate, user=Depends(get_current_user)):
    try:
        mat_id = project_repo.consume_material(project_id, data.model_dump())
        return ApiResponse(success=True, message="Internal materials correctly consumed and allocated to Project", data={"id": mat_id})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{project_id}/costing", response_model=ApiResponse)
def get_costing_summary(project_id: int, user=Depends(get_current_user)):
    try:
        summary = project_repo.get_project_costing_summary(project_id)
        return ApiResponse(success=True, data=summary)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
