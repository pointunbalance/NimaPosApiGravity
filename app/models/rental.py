"""Rental schemas."""
from pydantic import BaseModel
from typing import Optional


class RentalCreate(BaseModel):
    customer_id: int
    customer_name: str = ""
    customer_phone: Optional[str] = ""
    customer_id_front: Optional[str] = ""
    customer_id_back: Optional[str] = ""
    product_id: int
    product_name: str = ""
    product_image: Optional[str] = ""
    booking_date: str
    pickup_date: str
    return_date: str
    price: float = 0
    deposit: float = 0
    notes: Optional[str] = ""
    size: Optional[str] = ""


class RentalUpdate(BaseModel):
    status: Optional[str] = None
    actual_return_date: Optional[str] = None
    is_deposit_returned: Optional[bool] = None
    notes: Optional[str] = None
