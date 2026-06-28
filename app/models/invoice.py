"""Invoice / Checkout schemas."""
from pydantic import BaseModel, Field
from typing import List, Optional


class PaymentLine(BaseModel):
    method: str  # cash, card, credit, wallet, cheque
    amount: float = Field(..., gt=0)
    reference: Optional[str] = None


class CheckoutItem(BaseModel):
    product_id: int
    qty: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    name: Optional[str] = None
    item_discount_type: str = "none" # none, flat, percentage
    item_discount_value: float = 0.0
    tax_rate: float = 15.0 # default 15%
    barcode: Optional[str] = None # For scale/hardware integration


class CheckoutRequest(BaseModel):
    items: List[CheckoutItem]
    payments: List[PaymentLine] # Supports Split Payments
    cart_discount_type: str = "none"
    cart_discount_value: float = 0.0
    customer_id: Optional[int] = None
    currency_id: Optional[int] = 1
    exchange_rate: Optional[float] = 1.0
    notes: Optional[str] = ""


class CheckoutResponse(BaseModel):
    success: bool
    invoice_id: Optional[int] = None


class VoidRequest(BaseModel):
    reason: str = Field(..., min_length=1)


class InvoiceItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str = ""
    qty: int
    unit_price: float
    line_total: float
    item_discount_type: str = "none"
    item_discount_value: float = 0.0
    item_discount_amount: float = 0.0
    net_line_total: float = 0.0


class InvoiceOut(BaseModel):
    id: int
    created_at: str
    subtotal: float
    tax: float
    total: float
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    is_void: bool = False
    voided_at: Optional[str] = None
    void_reason: Optional[str] = None
    payment_method: str = "cash"
    paid_amount: float = 0.0
    change_due: float = 0.0
    discount_type: str = "none"
    discount_value: float = 0.0
    discount_amount: float = 0.0
    net_total: float = 0.0
    branch_id: int = 1
    currency_id: int = 1
    exchange_rate: float = 1.0
    refunded_amount: float = 0.0
    items: List[InvoiceItemOut] = []
