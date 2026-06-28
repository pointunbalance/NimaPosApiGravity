"""Warehouse, Batch, Serial, Table, HeldOrder, CustomerPayment schemas."""
from pydantic import BaseModel
from typing import Optional


# ── Warehouse ──
class WarehouseCreate(BaseModel):
    name: str
    address: Optional[str] = ""
    is_main: bool = False

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    is_main: Optional[bool] = None

# ── Batch ──
class BatchCreate(BaseModel):
    product_id: int
    product_name: str = ""
    warehouse_id: int
    quantity: int
    expiry_date: Optional[str] = None
    batch_number: Optional[str] = ""
    received_date: str
    cost_price: float = 0

# ── Serial ──
class SerialCreate(BaseModel):
    product_id: int
    serial_number: str
    warehouse_id: Optional[int] = None
    purchase_id: Optional[int] = None

class SerialUpdate(BaseModel):
    status: str
    order_id: Optional[int] = None

# ── Dining Table ──
class TableCreate(BaseModel):
    name: str
    zone: str = ""
    seats: int = 4

class TableUpdate(BaseModel):
    name: Optional[str] = None
    zone: Optional[str] = None
    seats: Optional[int] = None
    status: Optional[str] = None

# ── Held Order ──
class HeldOrderCreate(BaseModel):
    items_json: str = "[]"
    customer_id: Optional[int] = None
    note: Optional[str] = ""

# ── Customer Payment ──
class CustomerPaymentCreate(BaseModel):
    customer_id: int
    amount: float
    type: str = "debt_payment"
    note: Optional[str] = ""
    recorded_by: Optional[str] = ""
