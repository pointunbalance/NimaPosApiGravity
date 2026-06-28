import re
import base64

def parse_scale_barcode(barcode: str, prefix: str = "27", mode: str = "weight") -> dict:
    """
    Parses a weighted or priced barcode (EAN13 Standard).
    PP IIIII VVVVV C
    P = Prefix (e.g. 20, 21, 27)
    I = Item SKU (5 digits)
    V = Value (5 digits: can be Weight in grams or Price in cents)
    C = Checksum
    """
    if not barcode or len(barcode) != 13 or not barcode.startswith(prefix):
        return None
    
    # regex to split: PP (2) IIIII (5) VVVVV (5) C (1)
    match = re.match(rf"^{prefix}(\d{{5}})(\d{{5}})\d$", barcode)
    if not match:
        return None
    
    sku = match.group(1)
    value_raw = int(match.group(2))
    
    if mode == "weight":
        # Usually grams (3 decimals: 01500 -> 1.500 kg)
        quantity = value_raw / 1000.0
        return {"sku": sku, "quantity": round(quantity, 3), "is_weighted": True, "type": "scale_weight"}
    else:
        # Price Mode (2 decimals: 01550 -> 15.50 Currency)
        total_price = value_raw / 100.0
        return {"sku": sku, "total_price": round(total_price, 2), "is_priced": True, "type": "scale_price"}

def validate_ean13(barcode: str) -> bool:
    """Standard EAN13 Checksum Validation."""
    if not barcode or not re.match(r"^\d{13}$", barcode):
        return False
    digits = [int(d) for d in barcode]
    # Sum product of digits by 1 or 3
    total = sum(d * (3 if i % 2 else 1) for i, d in enumerate(digits[:-1]))
    check = (10 - (total % 10)) % 10
    return check == digits[-1]

def generate_zatca_qr(seller_name: str, vat_number: str, timestamp: str, total: str, vat_amount: str) -> str:
    """
    Generates a ZATCA compliant TLV encoded Base64 string for E-Invoicing QR codes.
    Total and VAT should be strings representing the amounts.
    """
    def to_tlv(tag, value):
        # Force to string and handle None
        val_str = str(value) if value is not None else ""
        tag_byte = bytes([tag])
        length_byte = bytes([len(val_str.encode('utf-8'))])
        value_bytes = val_str.encode('utf-8')
        return tag_byte + length_byte + value_bytes

    # Tag 1: Seller Name
    # Tag 2: VAT Number
    # Tag 3: Timestamp
    # Tag 4: Total (with VAT)
    # Tag 5: VAT Amount
    tlv_data = (
        to_tlv(1, seller_name) +
        to_tlv(2, vat_number) +
        to_tlv(3, timestamp) +
        to_tlv(4, total) +
        to_tlv(5, vat_amount)
    )
    
    return base64.b64encode(tlv_data).decode('utf-8')
