from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.common import ApiResponse
from app.models.crm import (
    SegmentCreate, SegmentOut,
    CampaignCreate, CampaignOut,
    InteractionLogCreate, InteractionLogOut
)
from app.repositories import crm_repo
from app.middleware.auth_middleware import require_any, require_manager, get_current_user

router = APIRouter(prefix="/crm", tags=["[Phase 16] Advanced CRM"])

# ── Segments ──
@router.post("/segments", response_model=ApiResponse[int], dependencies=[Depends(require_manager)])
def create_segment(req: SegmentCreate):
    """Create a new dynamic customer segment."""
    try:
        segment_id = crm_repo.create_segment(req.name, req.criteria_json)
        return {"ok": True, "data": segment_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/segments", response_model=ApiResponse[List[SegmentOut]], dependencies=[Depends(require_any)])
def get_segments():
    """List all defined customer segments."""
    segments = crm_repo.get_segments()
    return {"ok": True, "data": segments}

# ── Campaigns ──
@router.post("/campaigns", response_model=ApiResponse[int], dependencies=[Depends(require_manager)])
def create_campaign(req: CampaignCreate):
    """Draft a new marketing campaign targeting a specific segment."""
    try:
        camp_id = crm_repo.create_campaign(
            req.name, req.type, req.segment_id, req.message_template, req.scheduled_at
        )
        return {"ok": True, "data": camp_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/campaigns", response_model=ApiResponse[List[CampaignOut]], dependencies=[Depends(require_any)])
def get_campaigns():
    """List all marketing campaigns."""
    campaigns = crm_repo.get_campaigns()
    return {"ok": True, "data": campaigns}

@router.post("/campaigns/{campaign_id}/execute", response_model=ApiResponse[bool], dependencies=[Depends(require_manager)])
def execute_campaign(campaign_id: int):
    """Execute/Dispatch a drafted marketing campaign."""
    crm_repo.execute_campaign(campaign_id)
    return {"ok": True, "data": True}

# ── Interactions ──
@router.post("/interactions", response_model=ApiResponse[int])
def log_interaction(req: InteractionLogCreate, current_user: dict = Depends(require_any)):
    """Log a touchpoint or interaction with a customer (Call, Visit, SMS)."""
    try:
        int_id = crm_repo.log_interaction(
            req.customer_id, req.type, req.notes, current_user["user_id"]
        )
        return {"ok": True, "data": int_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/customers/{customer_id}/history", response_model=ApiResponse[List[InteractionLogOut]], dependencies=[Depends(require_any)])
def get_customer_history(customer_id: int):
    """Retrieve the entire interaction history of a specific customer."""
    history = crm_repo.get_customer_history(customer_id)
    return {"ok": True, "data": history}

# ── Maintenance ──
@router.post("/evaluate-tiers", response_model=ApiResponse[str], dependencies=[Depends(require_manager)])
def trigger_tier_evaluation(user: dict = Depends(get_current_user)):
    """Force re-evaluation of all customer tiers based on lifetime spending."""
    crm_repo.evaluate_customer_tiers()
    return {"ok": True, "data": "Tiers evaluated successfully."}
