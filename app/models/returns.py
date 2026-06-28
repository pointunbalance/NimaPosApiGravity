"""Returns schemas."""
from pydantic import BaseModel, Field
from typing import List, Optional


class ReturnItemRequest(BaseModel):
    product_id: int
    qty: int = Field(..., gt=0)


class CreateReturnRequest(BaseModel):
    invoice_id: int
    items: List[ReturnItemRequest]
    refund_method: str = "cash"
    notes: str = ""


class ReturnItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str = ""
    qty: int
    unit_price: float
    line_total: float


class ReturnOut(BaseModel):
    id: int
    created_at: str
    original_invoice_id: int
    customer_id: Optional[int] = None
    user_id: int
    refund_method: str = "cash"
    refund_amount: float = 0.0
    branch_id: int = 1
    notes: str = ""
    items: List[ReturnItemOut] = []


class EligibleReturnItem(BaseModel):
    product_id: int
    sku: str
    name: str
    sold_qty: int
    already_returned: int
    available_qty: int
    unit_price: float
