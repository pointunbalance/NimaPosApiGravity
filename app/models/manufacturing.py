"""Manufacturing schemas — BOMs and Production Orders."""
from pydantic import BaseModel
from typing import List, Optional

class BOMItemCreate(BaseModel):
    component_product_id: int
    quantity: float
    unit_name: Optional[str] = ""
    wastage_percent: Optional[float] = 0
    unit_cost: Optional[float] = 0

class BOMCreate(BaseModel):
    product_id: int
    name: str
    version: Optional[str] = "1.0"
    total_estimated_cost: Optional[float] = 0
    items: List[BOMItemCreate]

class ProductionRequest(BaseModel):
    bom_id: int
    quantity: float
