from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class PurchaseOrderItemBase(BaseModel):
    product_id: int
    product_name: Optional[str] = None
    ordered_qty: float
    received_qty: float = 0
    unit_price: float = 0
    line_total: Optional[float] = None

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItem(PurchaseOrderItemBase):
    id: int
    po_id: int

    model_config = ConfigDict(from_attributes=True)

class PurchaseOrderBase(BaseModel):
    po_number: Optional[str] = None
    supplier_id: int
    supplier_name: Optional[str] = None
    status: str = "draft"
    expected_date: Optional[str] = None
    notes: Optional[str] = None
    created_by: str = ""

class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = None
    received_date: Optional[str] = None
    received_qty_updates: Optional[List[dict]] = None # [{item_id, received_qty}]
    purchase_id: Optional[int] = None
    approved_by: Optional[str] = None

class PurchaseOrder(PurchaseOrderBase):
    id: int
    total_items: int = 0
    subtotal: float = 0
    tax_amount: float = 0
    total_amount: float = 0
    received_date: Optional[str] = None
    purchase_id: Optional[int] = None
    approved_by: Optional[str] = None
    created_at: str
    items: Optional[List[PurchaseOrderItem]] = []

    model_config = ConfigDict(from_attributes=True)
