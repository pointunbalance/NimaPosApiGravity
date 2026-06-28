"""Router for Fixed Asset Lifecycle — movements, maintenance, and disposal."""
from fastapi import APIRouter, Depends, HTTPException
from app.models.common import ApiResponse
from app.models.accounting import AssetMovementRequest, AssetMaintenanceLogCreate
from app.repositories import asset_lifecycle_repo, accounting_repo
from app.middleware.auth_middleware import require_role

router = APIRouter(prefix="/assets", tags=["Asset Lifecycle"])

@router.get("/{a_id}/movements", response_model=ApiResponse, summary="Get asset movement history")
def get_movements(a_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    """Returns the full transfer history of a specific asset between locations."""
    history = asset_lifecycle_repo.get_movement_history(a_id)
    return ApiResponse(ok=True, data=history)

@router.post("/{a_id}/movements", response_model=ApiResponse, summary="Record asset movement")
def record_movement(a_id: int, req: AssetMovementRequest, user: dict = Depends(require_role(["manager", "owner"]))):
    """Logs the movement of an asset to a new location (branch/site)."""
    asset_lifecycle_repo.log_movement(a_id, req.to_location, req.authorized_by, req.reason)
    return ApiResponse(ok=True, data={"message": f"Asset moved to {req.to_location}"})

@router.get("/{a_id}/maintenance", response_model=ApiResponse, summary="Get asset maintenance history")
def get_maintenance(a_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    """Returns the maintenance and repair log of a specific asset."""
    history = asset_lifecycle_repo.get_maintenance_history(a_id)
    return ApiResponse(ok=True, data=history)

@router.post("/{a_id}/maintenance", response_model=ApiResponse, summary="Log asset maintenance")
def log_maintenance(a_id: int, req: AssetMaintenanceLogCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    """Records a maintenance or repair action for an asset."""
    asset_lifecycle_repo.log_maintenance(a_id, req.dict())
    return ApiResponse(ok=True, data={"message": "Maintenance log recorded"})

@router.post("/{a_id}/dispose", response_model=ApiResponse, summary="Dispose/Retire asset")
def dispose_asset(a_id: int, salvage_value: float, reason: str = "", user: dict = Depends(require_role(["owner"]))):
    """Retires an asset from service and records its salvage/disposal value."""
    asset_lifecycle_repo.dispose_asset(a_id, salvage_value, reason)
    return ApiResponse(ok=True, data={"message": "Asset retired/disposed"})
