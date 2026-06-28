"""Quotation schemas."""
from pydantic import BaseModel
from typing import Optional


class QuotationCreate(BaseModel):
    customer_name: str
    customer_id: Optional[int] = None
    items_json: str = "[]"
    subtotal: float = 0
    discount_amount: float = 0
    tax_amount: float = 0
    total_amount: float = 0
    expiry_date: Optional[str] = None
    notes: Optional[str] = ""
    created_by: Optional[str] = ""


class QuotationUpdate(BaseModel):
    customer_name: Optional[str] = None
    items_json: Optional[str] = None
    subtotal: Optional[float] = None
    discount_amount: Optional[float] = None
    tax_amount: Optional[float] = None
    total_amount: Optional[float] = None
    status: Optional[str] = None
    expiry_date: Optional[str] = None
    notes: Optional[str] = None
