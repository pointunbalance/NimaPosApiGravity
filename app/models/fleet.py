"""Fleet models."""
from pydantic import BaseModel
from typing import Optional, List

class VehicleBase(BaseModel):
    plate_number: str
    model: str
    vehicle_type: Optional[str] = "Truck"
    payload_capacity_kg: Optional[float] = 0.0
    status: Optional[str] = "available"
    odometer_reading: Optional[float] = 0.0

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    plate_number: Optional[str] = None
    model: Optional[str] = None
    vehicle_type: Optional[str] = None
    payload_capacity_kg: Optional[float] = None
    status: Optional[str] = None
    odometer_reading: Optional[float] = None
    last_service_date: Optional[str] = None
    is_active: Optional[bool] = None

class DriverAssignmentRequest(BaseModel):
    vehicle_id: int
    driver_id: int
    notes: Optional[str] = ""

class FuelLogCreate(BaseModel):
    vehicle_id: int
    date: Optional[str] = None
    liters: float
    cost: float
    odometer_reading: Optional[float] = None
    receipt_image: Optional[str] = None
