"""Inventory / Stock schemas."""
from pydantic import BaseModel, Field
from typing import Optional


class StockAdjustRequest(BaseModel):
    product_id: int
    qty_delta: int = Field(..., description="Positive to add, negative to subtract")
    notes: str = ""


class StockMovementOut(BaseModel):
    id: int
    created_at: str
    product_id: int
    product_name: str = ""
    movement_type: str
    qty_delta: int
    reference_type: str = "manual"
    reference_id: Optional[int] = None
    user_id: Optional[int] = None
    branch_id: int = 1
    notes: str = ""


class InventorySummary(BaseModel):
    total_products: int = 0
    total_stock_value: float = 0.0
    low_stock_count: int = 0
