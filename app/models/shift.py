"""Shift schemas."""
from pydantic import BaseModel
from typing import Optional


class ShiftOpen(BaseModel):
    start_cash: float = 0
    user_id: Optional[int] = None
    branch_id: int = 1


class ShiftClose(BaseModel):
    actual_cash: float
    notes: Optional[str] = ""


class StockAdjustmentCreate(BaseModel):
    product_id: int
    product_name: str = ""
    type: str = "increase"
    quantity: int
    reason: str = "correction"
    date: str
    notes: Optional[str] = ""
    warehouse_id: Optional[int] = None
    warehouse_name: Optional[str] = ""
