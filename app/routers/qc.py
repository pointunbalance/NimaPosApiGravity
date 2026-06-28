"""Quality Control router — Inspections, Rules, and Batch Status."""
from fastapi import APIRouter, Depends
from app.models.common import ApiResponse
from app.models.qc import QCInspectionCreate, QCRuleCreate
from app.repositories import qc_repo
from app.middleware.auth_middleware import require_role

router = APIRouter(prefix="/qc", tags=["Quality Control"])

@router.get("/pending", response_model=ApiResponse, summary="List batches pending QC")
def get_pending(user: dict = Depends(require_role(["manager", "owner"]))):
    """Returns all product batches that are currently in 'Pending' status."""
    data = qc_repo.get_pending_inspections()
    return ApiResponse(ok=True, data=data)

@router.post("/inspect", response_model=ApiResponse, summary="Record QC Inspection")
def record_inspection(req: QCInspectionCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    """
    Submits a quality inspection report for a batch. 
    Updates the batch status to Passed, Failed, or Partial.
    """
    inspection_id = qc_repo.create_inspection(req.dict())
    return ApiResponse(ok=True, data={"inspection_id": inspection_id, "message": f"Inspection recorded. Status: {req.status}"})

@router.get("/history", response_model=ApiResponse, summary="Get QC Inspection history")
def get_history(product_id: int = None, user: dict = Depends(require_role(["manager", "owner"]))):
    """View historical QC inspections for a specific product or all products."""
    data = qc_repo.get_inspection_history(product_id)
    return ApiResponse(ok=True, data=data)

@router.get("/inspections/{i_id}/defects", response_model=ApiResponse, summary="Get inspection defects")
def get_defects(i_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    """List detailed defects recorded during a specific inspection."""
    data = qc_repo.get_defects(i_id)
    return ApiResponse(ok=True, data=data)

@router.post("/rules", response_model=ApiResponse, summary="Set QC Rule")
def set_rule(req: QCRuleCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    """Defines a QC rule (e.g. mandatory inspection for a category or product)."""
    qc_repo.set_qc_rule(req.dict())
    return ApiResponse(ok=True, data={"message": "QC rule updated"})
