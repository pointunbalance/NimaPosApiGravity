import json
import re
from typing import Optional, Dict

def normalize_phone_number(phone: str, default_country_code: str = "966") -> str:
    """Normalize phone numbers to a dialable international format."""
    digits = re.sub(r"\D", "", str(phone or ""))
    if not digits:
        return ""
    if digits.startswith("00"):
        digits = digits[2:]
    
    country_code = re.sub(r"\D", "", str(default_country_code or ""))
    if country_code and digits.startswith("0"):
        digits = digits.lstrip("0")
        return f"{country_code}{digits}"
    if country_code and digits.startswith(country_code):
        return digits
    return digits

class SafeDict(dict):
    """Format-map helper that returns empty strings for missing keys."""
    def __missing__(self, key):
        return ""

DEFAULT_TEMPLATES = {
    "received": "تم استلام جهازك {device_type} {model} برقم تذكرة {order_number}. نحن نعمل على تشخيصه الآن.",
    "ready": "جهازك {device_type} {model} جاهز للاستلام. التكلفة النهائية: {final_cost} ريال.",
    "delivered": "تم تسليم الجهاز بنجاح. شكراً لتعاملك معنا!",
    "cancelled": "تم إلغاء تذكرة الصيانة رقم {order_number}. يمكنك استلام جهازك في أي وقت."
}

def build_whatsapp_message(template_key: str, context: Dict) -> str:
    """Render a WhatsApp message from a template key and context."""
    template = DEFAULT_TEMPLATES.get(template_key, "تحديث لحالة الصيانة: {status} لتذكرة {order_number}.")
    try:
        return template.format_map(SafeDict(context)).strip()
    except Exception:
        return f"تحديث تذكرة {context.get('order_number')}: {template_key}"

def generate_whatsapp_link(phone: str, message: str) -> str:
    """Generate a wa.me link for the frontend to open."""
    from urllib.parse import quote
    encoded_message = quote(message)
    return f"https://wa.me/{phone}?text={encoded_message}"
