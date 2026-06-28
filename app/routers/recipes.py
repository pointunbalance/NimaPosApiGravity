from fastapi import APIRouter, Depends, HTTPException
from app.models.recipe import RecipeCreate, RecipeUpdate
from app.repositories import recipe_repo
from app.middleware.auth_middleware import require_role
from typing import List, Optional

router = APIRouter(prefix="/recipes", tags=["Advanced"])

@router.post("/", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Create a new production recipe/BOM")
def create_recipe(data: RecipeCreate):
    return {"id": recipe_repo.create_recipe(data)}

@router.get("/{product_id}", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Get recipe associated with a finished product")
def get_recipe(product_id: int):
    res = recipe_repo.get_recipe_by_product(product_id)
    if not res: raise HTTPException(status_code=404, detail="Recipe not found for this product")
    return res

@router.post("/deduct/{product_id}", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Deduct raw materials based on generated product quantity")
def deduct_stock(product_id: int, qty: float):
    if not recipe_repo.deduct_recipe_stock(product_id, qty):
        raise HTTPException(status_code=400, detail="Failed to deduct stock from recipe")
    return {"message": "Ingredients deducted from stock based on recipe"}
