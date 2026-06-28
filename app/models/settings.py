"""Settings schemas."""
from pydantic import BaseModel
from typing import Optional, Dict


class SettingOut(BaseModel):
    key: str
    value: str


class SettingUpdate(BaseModel):
    value: str
