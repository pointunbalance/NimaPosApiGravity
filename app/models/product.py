"""Product schemas."""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class ProductCreate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    sku: str = Field(..., description="Unique product SKU")
    name: str = Field(..., description="Product name")
    name_en: Optional[str] = ""
    price: float = Field(0.0, ge=0)
    price_wholesale: float = Field(0.0, ge=0)
    price_half_wholesale: float = Field(0.0, ge=0)
    price_other: float = Field(0.0, ge=0)
    cost_price: float = Field(0.0, ge=0)
    stock_qty: int = Field(0, ge=0)
    barcode: str = ""
    category: str = ""
    color: Optional[str] = None
    size: Optional[str] = None
    material: Optional[str] = None
    is_bundle: bool = False
    reorder_level: int = 5
    brand_id: Optional[int] = None
    origin_id: Optional[int] = None
    location_id: Optional[int] = None
    manufacturer_id: Optional[int] = None
    is_important: bool = False
    is_shortage: bool = False
    model_number: Optional[str] = None
    type: str = "simple"
    composition_json: str = "[]"
    ref_currency_id: Optional[int] = None
    ref_cost_price: Optional[float] = None


class ProductUpdate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    name: Optional[str] = None
    name_en: Optional[str] = None
    price: Optional[float] = None
    price_wholesale: Optional[float] = None
    price_half_wholesale: Optional[float] = None
    price_other: Optional[float] = None
    cost_price: Optional[float] = None
    stock_qty: Optional[int] = None
    barcode: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    color: Optional[str] = None
    size: Optional[str] = None
    material: Optional[str] = None
    is_bundle: Optional[bool] = None
    reorder_level: Optional[int] = None
    brand_id: Optional[int] = None
    origin_id: Optional[int] = None
    location_id: Optional[int] = None
    manufacturer_id: Optional[int] = None
    is_important: Optional[bool] = None
    is_shortage: Optional[bool] = None
    model_number: Optional[str] = None
    type: Optional[str] = None
    composition_json: Optional[str] = None
    ref_currency_id: Optional[int] = None
    ref_cost_price: Optional[float] = None


class ProductOut(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    id: int
    sku: str
    name: str
    name_en: Optional[str] = ""
    price: float
    price_wholesale: float = 0.0
    price_half_wholesale: float = 0.0
    price_other: float = 0.0
    cost_price: float = 0.0
    stock_qty: int
    is_active: bool = True
    barcode: str = ""
    category: str = ""
    color: Optional[str] = None
    size: Optional[str] = None
    material: Optional[str] = None
    is_bundle: bool = False
    reorder_level: int = 5
    brand_id: Optional[int] = None
    origin_id: Optional[int] = None
    location_id: Optional[int] = None
    manufacturer_id: Optional[int] = None
    is_important: bool = False
    is_shortage: bool = False
    model_number: Optional[str] = None
    ref_currency_id: Optional[int] = None
    ref_cost_price: Optional[float] = None
    updated_at: Optional[str] = None
