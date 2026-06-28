"""Supplier schemas."""
from pydantic import BaseModel, Field
from typing import Optional


class SupplierCreate(BaseModel):
    code: str = Field(..., description="Unique supplier code")
    name: str = Field(..., description="Supplier name")
    name_en: Optional[str] = ""
    phone: str = ""
    email: str = ""
    tax_id: str = ""
    address: str = ""
    notes: str = ""


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class SupplierOut(BaseModel):
    id: int
    code: str
    name: str
    name_en: Optional[str] = ""
    phone: str = ""
    email: str = ""
    tax_id: str = ""
    address: str = ""
    notes: str = ""
    is_active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
