"""Purchase schemas."""
from pydantic import BaseModel
from typing import Optional


class PurchaseCreate(BaseModel):
    supplier_id: int
    supplier_name: str = ""
    date: str
    items_json: str = "[]"
    subtotal: float = 0
    tax_amount: float = 0
    discount_amount: float = 0
    total_amount: float = 0
    invoice_number: Optional[str] = ""
    notes: Optional[str] = ""
    attachment: Optional[str] = ""
    update_sale_prices: Optional[bool] = False
    currency_id: Optional[int] = 1
    exchange_rate: Optional[float] = 1.0


class PurchaseUpdate(BaseModel):
    items_json: Optional[str] = None
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    discount_amount: Optional[float] = None
    total_amount: Optional[float] = None
    invoice_number: Optional[str] = None
    notes: Optional[str] = None
