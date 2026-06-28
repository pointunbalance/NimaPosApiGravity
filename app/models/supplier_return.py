from pydantic import BaseModel, Field
from typing import List, Optional

class SupplierReturnItem(BaseModel):
    product_id: int
    qty: int
    unit_cost: float
    line_total: float

class SupplierReturnCreate(BaseModel):
    supplier_id: int
    date: str
    items: List[SupplierReturnItem]
    total_amount: float
    reason_id: Optional[int] = None
    notes: Optional[str] = None

class SupplierReturnOut(BaseModel):
    id: int
    supplier_id: int
    date: str
    total_amount: float
    reason_id: Optional[int]
    notes: Optional[str]
    status: str
    created_at: str
