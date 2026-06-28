from pydantic import BaseModel, Field
from typing import Optional, List

class ScaleConfigCreate(BaseModel):
    name: str
    prefix: str = "20"
    mode: str = "weight" # weight, price
    ean_type: str = "ean13"
    is_active: bool = True

class LabelTemplateCreate(BaseModel):
    name: str
    width_mm: int = 40
    height_mm: int = 30
    content_template: str

class LabelDesignItem(BaseModel):
    type: str # text, barcode, price, qty
    x: int
    y: int
    content: Optional[str] = None
    font_size: Optional[int] = 12
