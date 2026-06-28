"""Manufacturing router — BOMs and Production."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.models.manufacturing import BOMCreate, ProductionRequest
from app.models.common import ApiResponse
from app.repositories import manufacturing_repo
from app.middleware.auth_middleware import require_role

router = APIRouter(prefix="/manufacturing", tags=["Manufacturing / Production"])

@router.get("/boms", response_model=ApiResponse, summary="List BOMs")
def list_boms(product_id: Optional[int] = None, user: dict = Depends(require_role(["manager", "owner"]))):
    return ApiResponse(ok=True, data=manufacturing_repo.list_boms(product_id))

@router.post("/boms", response_model=ApiResponse, summary="Create BOM")
def create_bom(payload: BOMCreate, user: dict = Depends(require_role(["owner"]))):
    bom_id = manufacturing_repo.create_bom(payload.model_dump())
    return ApiResponse(ok=True, data=manufacturing_repo.get_bom(bom_id))

@router.get("/boms/{bom_id}", response_model=ApiResponse, summary="Get BOM details")
def get_bom(bom_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    bom = manufacturing_repo.get_bom(bom_id)
    if not bom: raise HTTPException(404, "BOM not found")
    return ApiResponse(ok=True, data=bom)

@router.post("/produce", response_model=ApiResponse, summary="Execute Production Order")
def produce(payload: ProductionRequest, user: dict = Depends(require_role(["owner"]))):
    try:
        manufacturing_repo.produce_product(payload.bom_id, payload.quantity)
        return ApiResponse(ok=True, data={"message": f"Successfully produced {payload.quantity} units"})
    except Exception as e:
        raise HTTPException(400, str(e))
