from fastapi import APIRouter, Depends, HTTPException
from app.models.delivery import DeliveryAssignmentCreate, DeliveryAssignmentUpdate
from app.repositories import delivery_repo
from app.middleware.auth_middleware import require_role
from app.models.common import ApiResponse
from typing import List, Optional

router = APIRouter(prefix="/delivery", tags=["Orders"])

@router.post("/", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Assign an invoice to a delivery driver")
def assign_delivery(data: DeliveryAssignmentCreate):
    return ApiResponse(ok=True, data={"id": delivery_repo.assign_delivery(data)})

@router.put("/{id}", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Update delivery status (e.g., delivered, failed)")
def update_status(id: int, data: DeliveryAssignmentUpdate):
    if not delivery_repo.update_delivery_status(id, data):
        raise HTTPException(status_code=404, detail="Assignment not found")
    return ApiResponse(ok=True, data={"message": "Delivery assignment updated"})

@router.get("/", dependencies=[Depends(require_role(["owner", "admin"]))], summary="List delivery assignments")
def list_assignments(driver_id: int = None, status: str = None):
    data = delivery_repo.list_deliveries(driver_id, status)
    return ApiResponse(ok=True, data=data)


@router.get("/{id}", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Get delivery details")
def get_delivery(id: int):
    d = delivery_repo.get_delivery(id)
    if not d:
        raise HTTPException(status_code=404, detail="Delivery assignment not found")
    return ApiResponse(ok=True, data=d)


@router.delete("/{id}", dependencies=[Depends(require_role(["owner"]))], summary="Cancel delivery assignment")
def cancel_delivery(id: int):
    if not delivery_repo.delete_delivery(id):
        raise HTTPException(status_code=404, detail="Assignment not found")
    return ApiResponse(ok=True, data={"message": "Delivery cancelled"})
