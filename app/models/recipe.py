from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class RecipeItemBase(BaseModel):
    ingredient_id: int
    ingredient_name: Optional[str] = None
    qty: float  # Renamed from quantity for consistency with DB
    unit: str = "unit"
    unit_cost: float = 0
    line_cost: Optional[float] = None
    wastage_pct: float = 0

class RecipeItemCreate(RecipeItemBase):
    pass

class RecipeItem(RecipeItemBase):
    id: int
    recipe_id: int

    model_config = ConfigDict(from_attributes=True)

class RecipeBase(BaseModel):
    product_id: int
    product_name: Optional[str] = None
    yield_qty: float = 1
    total_cost: float = 0
    is_active: int = 1
    notes: Optional[str] = None

class RecipeCreate(RecipeBase):
    items: List[RecipeItemCreate]

class RecipeUpdate(BaseModel):
    yield_qty: Optional[float] = None
    total_cost: Optional[float] = None
    is_active: Optional[int] = None
    notes: Optional[str] = None
    items: Optional[List[RecipeItemCreate]] = None

class Recipe(RecipeBase):
    id: int
    created_at: str
    updated_at: Optional[str] = None
    items: Optional[List[RecipeItem]] = []

    model_config = ConfigDict(from_attributes=True)
