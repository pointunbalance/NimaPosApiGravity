from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class BranchTransferItemBase(BaseModel):
    product_id: int
    product_name: Optional[str] = None
    requested_qty: float
    sent_qty: float = 0
    received_qty: float = 0
    unit_cost: float = 0

class BranchTransferItemCreate(BranchTransferItemBase):
    pass

class BranchTransferItem(BranchTransferItemBase):
    id: int
    transfer_id: int

    model_config = ConfigDict(from_attributes=True)

class BranchTransferBase(BaseModel):
    reference: Optional[str] = None
    from_warehouse_id: int
    to_warehouse_id: int
    status: str = "pending"
    requested_by: str = ""
    approved_by: Optional[str] = None
    notes: Optional[str] = None

class BranchTransferCreate(BranchTransferBase):
    items: List[BranchTransferItemCreate]

class BranchTransferUpdate(BaseModel):
    status: Optional[str] = None
    sent_qty_updates: Optional[List[dict]] = None # [{item_id, sent_qty}]
    received_qty_updates: Optional[List[dict]] = None # [{item_id, received_qty}]
    approved_by: Optional[str] = None

class BranchTransfer(BranchTransferBase):
    id: int
    total_items: int = 0
    total_qty: float = 0
    created_at: str
    completed_at: Optional[str] = None
    items: Optional[List[BranchTransferItem]] = []

    model_config = ConfigDict(from_attributes=True)
