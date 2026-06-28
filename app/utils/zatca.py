import hashlib
import uuid
import struct
import base64
from datetime import datetime

# Dummy Keys for development (In production, replace with actual ECDSA Keys issued by ZATCA)
DUMMY_SIGNATURE = base64.b64encode(b"dummy_ecdsa_signature_mock").decode('utf-8')
DUMMY_PUB_KEY = base64.b64encode(b"dummy_ecdsa_public_key_mock").decode('utf-8')

def generate_uuid() -> str:
    """Generates a UUID for a new invoice."""
    return str(uuid.uuid4())

def compute_invoice_hash(xml_string: str) -> str:
    """Computes the SHA-256 hash of the UBL 2.1 XML and returns Base64 byte array."""
    # Note: Phase 2 requires specific XML canonicalization (C14N) before hashing.
    sha256_hash = hashlib.sha256(xml_string.encode('utf-8')).digest()
    return base64.b64encode(sha256_hash).decode('utf-8')

def generate_invoice_xml(invoice_data: dict, zatca_settings: dict) -> str:
    """
    Generates a basic UBL 2.1 Invoice XML.
    In a fully integrated ZATCA Phase 2 scenario, this XML includes:
    - UUID
    - Previous Invoice Hash
    - Seller/Buyer details
    - Line Items
    - Cryptographic Identifiers.
    """
    invoice_uuid = invoice_data.get('uuid', generate_uuid())
    prev_hash = invoice_data.get('previous_invoice_hash', 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==')
    
    # Minimal mock XML structure for hashing (Simulated Phase 2 Canonical XML)
    xml_template = f"""<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
    <cbc:ID>{invoice_data.get('id', 'INV-0001')}</cbc:ID>
    <cbc:UUID>{invoice_uuid}</cbc:UUID>
    <cbc:IssueDate>{invoice_data.get('created_at', datetime.now().isoformat())}</cbc:IssueDate>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyName>
                <cbc:Name>{zatca_settings.get('company_name', 'TechVibe')}</cbc:Name>
            </cac:PartyName>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>{zatca_settings.get('vat_number', '300000000000003')}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:LegalMonetaryTotal>
        <cbc:TaxExclusiveAmount currencyID="SAR">{invoice_data.get('subtotal', 0)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="SAR">{invoice_data.get('total', 0)}</cbc:TaxInclusiveAmount>
    </cac:LegalMonetaryTotal>
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <!-- ZATCA Cryptographic Stamp / Previous Invoice Hash -->
            <sig:UBLDocumentSignatures>
                <sac:SignatureInformation>
                    <cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>
                    <sbc:ReferencedSignatureID>{prev_hash}</sbc:ReferencedSignatureID>
                </sac:SignatureInformation>
            </sig:UBLDocumentSignatures>
        </ext:UBLExtension>
    </ext:UBLExtensions>
</Invoice>
"""
    return xml_template

def format_tlv(tag: int, value: str) -> bytes:
    """Formats a basic Type-Length-Value string as bytes"""
    value_bytes = value.encode('utf-8')
    length = len(value_bytes)
    return struct.pack("!BB", tag, length) + value_bytes

def generate_phase2_qr(seller_name: str, vat_no: str, timestamp: str, total: str, tax: str, hash_b64: str) -> str:
    """
    Generates the advanced ZATCA Phase 2 TLV Base64 QR code.
    Contains Phase 1 elements (1-5) and Phase 2 cryptographic components (6-9).
    """
    # 1: Seller's Name
    tlv_data = format_tlv(1, seller_name)
    # 2: VAT Registration Number
    tlv_data += format_tlv(2, vat_no)
    # 3: Timestamp Display format
    tlv_data += format_tlv(3, timestamp)
    # 4: Invoice Total (with VAT)
    tlv_data += format_tlv(4, total)
    # 5: VAT Total
    tlv_data += format_tlv(5, tax)
    # 6: Hash of XML (Phase 2 extension)
    tlv_data += format_tlv(6, hash_b64)
    # 7: ECDSA digital signature (Dummy)
    tlv_data += format_tlv(7, DUMMY_SIGNATURE)
    # 8: ECDSA Public Key (Dummy)
    tlv_data += format_tlv(8, DUMMY_PUB_KEY)
    
    return base64.b64encode(tlv_data).decode('utf-8')
