"""Pydantic models for Barcode / Sticker Printing."""
from pydantic import BaseModel
from typing import Optional


class LabelTemplateCreate(BaseModel):
    name: str
    type: str = "barcode"  # barcode | sticker
    width: float = 50
    height: float = 30
    horizontal_gap: float = 2
    vertical_gap: float = 2
    font_size: int = 12
    show_name: bool = True
    show_price: bool = True
    show_code: bool = True
    show_store_name: bool = False
    custom_text: Optional[str] = ""
    barcode_format: str = "CODE128"  # CODE128|CODE39|EAN13|UPC|ITF14|MSI
    paper_type: str = "thermal"  # thermal | a4
    labels_per_row: int = 2
    design_type: Optional[str] = "standard"
    config_json: Optional[str] = "{}"


class LabelTemplateUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    width: Optional[float] = None
    height: Optional[float] = None
    horizontal_gap: Optional[float] = None
    vertical_gap: Optional[float] = None
    font_size: Optional[int] = None
    show_name: Optional[bool] = None
    show_price: Optional[bool] = None
    show_code: Optional[bool] = None
    show_store_name: Optional[bool] = None
    custom_text: Optional[str] = None
    barcode_format: Optional[str] = None
    paper_type: Optional[str] = None
    labels_per_row: Optional[int] = None
    design_type: Optional[str] = None
    config_json: Optional[str] = None


class PrintQueueItem(BaseModel):
    product_id: int
    quantity: int = 1
