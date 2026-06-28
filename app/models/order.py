"""Pydantic models for Orders / Fulfillment / Kitchen."""
from pydantic import BaseModel
from typing import Optional


class OrderStatusUpdate(BaseModel):
    fulfillment_status: str  # pending | ready | served


class OrderItemCheck(BaseModel):
    """Mark a specific item inside an order as checked/prepared."""
    item_index: int
    checked: bool = True


class OrderFilter(BaseModel):
    order_type: Optional[str] = None  # dine-in | takeaway | delivery
    fulfillment_status: Optional[str] = None
    customer_id: Optional[int] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    is_void: Optional[int] = 0


class PartialRefundItem(BaseModel):
    product_id: int
    qty: int
    unit_price: float
