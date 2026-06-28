from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class InventoryCountItemBase(BaseModel):
    product_id: int
    product_name: Optional[str] = None
    system_qty: float
    actual_qty: float
    variance: Optional[float] = None
    unit_cost: float = 0
    variance_value: Optional[float] = None
    notes: Optional[str] = None

class InventoryCountItemCreate(InventoryCountItemBase):
    pass

class InventoryCountItem(InventoryCountItemBase):
    id: int
    count_id: int

    model_config = ConfigDict(from_attributes=True)

class InventoryCountBase(BaseModel):
    title: str
    warehouse_id: int = 1
    status: str = "draft"
    counted_by: str = ""
    approved_by: Optional[str] = None
    notes: Optional[str] = None

class InventoryCountCreate(InventoryCountBase):
    items: List[InventoryCountItemBase]

class InventoryCountUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    counted_by: Optional[str] = None
    approved_by: Optional[str] = None
    notes: Optional[str] = None

class InventoryCount(InventoryCountBase):
    id: int
    total_products: int = 0
    matched: int = 0
    surplus: int = 0
    deficit: int = 0
    total_variance_value: float = 0
    started_at: str
    completed_at: Optional[str] = None
    items: Optional[List[InventoryCountItem]] = []

    model_config = ConfigDict(from_attributes=True)
