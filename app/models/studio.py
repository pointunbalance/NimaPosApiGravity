"""Studio/Camera schemas."""
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class EventType(str, Enum):
    WEDDING = 'فرح / زفاف'
    ENGAGEMENT = 'خطوبة'
    ZAFFA = 'زفة'
    SESSION = 'سيشن تصوير'
    BAPTISM = 'معمودية'
    BABY_SHOWER = 'سبوع / بيبي شاور'
    RELIGIOUS = 'مناسبة دينية'
    OTHER = 'أخرى'


class EquipmentStatus(str, Enum):
    AVAILABLE = 'available'
    MAINTENANCE = 'maintenance'
    RETIRED = 'retired'
    IN_USE = 'in_use'


class EquipmentCategory(str, Enum):
    CAMERA = 'كاميرا'
    LENS = 'عدسة'
    LIGHTING = 'إضاءة'
    SOUND = 'صوت'
    DRONE = 'درون'
    ACCESSORIES = 'ملحقات'
    OTHER = 'أخرى'


class CameraCreate(BaseModel):
    name: str
    category: EquipmentCategory = EquipmentCategory.CAMERA
    model: Optional[str] = ""
    serial_number: Optional[str] = ""
    status: EquipmentStatus = EquipmentStatus.AVAILABLE
    purchase_date: Optional[str] = None
    purchase_price: Optional[float] = 0
    hourly_rate: Optional[float] = None
    daily_rate: Optional[float] = None
    session_rate: Optional[float] = None
    photo_rate: Optional[float] = None
    notes: Optional[str] = ""

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[EquipmentCategory] = None
    model: Optional[str] = None
    status: Optional[EquipmentStatus] = None
    purchase_date: Optional[str] = None
    purchase_price: Optional[float] = None
    hourly_rate: Optional[float] = None
    daily_rate: Optional[float] = None
    session_rate: Optional[float] = None
    photo_rate: Optional[float] = None
    notes: Optional[str] = None

class BookingCreate(BaseModel):
    camera_id: int
    camera_name: str = ""
    date: str
    start_time: str = "18:00"
    duration_hours: float = 0
    shift: str = "full"
    event_type: EventType = EventType.OTHER
    pricing_type: str = "session"
    quantity: int = 1
    unit_price: float = 0
    customer_name: str
    customer_phone: Optional[str] = ""
    technician_name: Optional[str] = ""
    assigned_team: List[int] = [] # List of TeamMember IDs
    city: Optional[str] = ""
    venue_type: Optional[str] = "studio"
    address: Optional[str] = ""
    price: float = 0
    deposit: float = 0
    notes: Optional[str] = ""
    shooting_duration: Optional[int] = None

class BookingUpdate(BaseModel):
    status: Optional[str] = None
    deposit: Optional[float] = None
    is_paid: Optional[bool] = None
    notes: Optional[str] = None
    assigned_team: Optional[List[int]] = None
    duration_hours: Optional[float] = None
