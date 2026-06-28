from pydantic import BaseModel
from typing import Optional

class ActivationRequest(BaseModel):
    license_key: str

class ActivationStatusOut(BaseModel):
    is_active: bool
    hardware_id: str
    activated_at: Optional[str] = None
    expires_at: Optional[str] = None
