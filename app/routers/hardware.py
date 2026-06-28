from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.models.hardware import ScaleConfigCreate, LabelTemplateCreate
from app.models.common import ApiResponse
from app.repositories import hardware_repo
from app.middleware.auth_middleware import get_current_user, require_role

router = APIRouter(prefix="/hardware", tags=["[Phase 28] Hardware & Scale Pro"])

@router.get("/scales", response_model=ApiResponse[List[dict]])
def list_scales(user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=hardware_repo.get_active_scales())

@router.post("/scales", response_model=ApiResponse[int])
def add_scale(config: ScaleConfigCreate, user: dict = Depends(require_role(["owner", "manager"]))):
    s_id = hardware_repo.add_scale_config(config.model_dump())
    return ApiResponse(ok=True, data=s_id)

@router.get("/barcode/parse", response_model=ApiResponse[dict])
def parse_barcode(barcode: str, user: dict = Depends(get_current_user)):
    parsed = hardware_repo.parse_any_scale_barcode(barcode)
    if not parsed:
        raise HTTPException(status_code=400, detail="Barcode not recognized by any scale configuration")
    return ApiResponse(ok=True, data=parsed)

@router.post("/labels/templates", response_model=ApiResponse[int])
def add_label_template(template: LabelTemplateCreate, user: dict = Depends(require_role(["owner", "manager"]))):
    t_id = hardware_repo.create_label_template(template.model_dump())
    return ApiResponse(ok=True, data=t_id)

@router.get("/labels/templates", response_model=ApiResponse[List[dict]])
def list_templates(user: dict = Depends(get_current_user)):
    return ApiResponse(ok=True, data=hardware_repo.list_label_templates())
