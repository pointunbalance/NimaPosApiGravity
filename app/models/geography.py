from pydantic import BaseModel
from typing import List, Optional

class SalesZone(BaseModel):
    id: Optional[int] = None
    city_id: int
    name: str

class City(BaseModel):
    id: Optional[int] = None
    governorate_id: int
    name: str
    name_en: Optional[str] = ""

class Governorate(BaseModel):
    id: Optional[int] = None
    name: str
    name_en: Optional[str] = ""
