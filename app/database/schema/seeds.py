import logging
import hashlib
import os as _os
from datetime import datetime

logger = logging.getLogger(__name__)

def _seed_data(cursor):
    """Seed default branch, owner user, warehouse, and accounting chart."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Default branch
    cursor.execute(
        "INSERT OR IGNORE INTO branches (id, code, name, created_at) VALUES (1, 'BR01', 'Main Branch', ?)",
        (now,),
    )

    # Default owner (PIN: 1234)
    salt = _os.urandom(16).hex()
    pin_hash = hashlib.pbkdf2_hmac("sha256", b"1234", bytes.fromhex(salt), 100_000).hex()
    cursor.execute(
        "INSERT OR IGNORE INTO users (id, username, pin_hash, pin_salt, role, created_at) "
        "VALUES (1, 'owner', ?, ?, 'owner', ?)",
        (pin_hash, salt, now),
    )

    # Default warehouse
    cursor.execute(
        "INSERT OR IGNORE INTO warehouses (id, name, is_main) VALUES (1, 'Main Warehouse', 1)"
    )

    # Default accounting chart of accounts
    default_accounts = [
        ("1010", "الصندوق (الكاش)", "asset", 1),
        ("1020", "البنك", "asset", 1),
        ("1030", "العملاء (ذمم مدينة)", "asset", 1),
        ("1040", "المخزون", "asset", 1),
        ("1050", "أوراق قبض", "asset", 1),
        ("1100", "الأصول الثابتة", "asset", 0),
        ("1110", "مجمع الإهلاك", "asset", 0),
        ("2010", "الموردين (ذمم دائنة)", "liability", 1),
        ("2020", "ضريبة مستحقة", "liability", 1),
        ("2030", "أوراق دفع", "liability", 1),
        ("3010", "رأس المال", "equity", 1),
        ("3020", "الأرباح المبقاة", "equity", 1),
        ("3030", "المسحوبات الشخصية", "equity", 0),
        ("4010", "المبيعات", "revenue", 1),
        ("4020", "إيرادات أخرى", "revenue", 0),
        ("4030", "خصم مكتسب", "revenue", 0),
        ("5010", "تكلفة البضاعة المباعة", "expense", 1),
        ("5020", "الإيجار", "expense", 0),
        ("5030", "الرواتب والأجور", "expense", 0),
        ("5040", "الكهرباء والماء", "expense", 0),
        ("5050", "خصم مسموح به", "expense", 0),
        ("5060", "مصروفات نثرية", "expense", 0),
        ("5070", "مصروف الإهلاك", "expense", 0),
    ]
    for code, name, acc_type, is_system in default_accounts:
        cursor.execute(
            "INSERT OR IGNORE INTO accounts (code, name, type, is_system) VALUES (?, ?, ?, ?)",
            (code, name, acc_type, is_system),
        )

    # Default safe
    cursor.execute(
        "INSERT OR IGNORE INTO safes (id, name, balance, is_active) VALUES (1, 'Main Safe', 0, 1)"
    )

    # Default App Settings
    app_settings = [
        ("costing_method", "weighted_average"),
        ("auto_backup_on_close", "0"),
        ("low_stock_threshold", "10"),
    ]
    for key, value in app_settings:
        cursor.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)", (key, value))

    logger.info("Seed data applied.")
    _seed_geography(cursor)

def _seed_geography(cursor):
    """Seed Egyptian governorates and major cities."""
    governorates = [
        ("القاهرة", "Cairo"), ("الجيزة", "Giza"), ("الإسكندرية", "Alexandria"),
        ("الدقهلية", "Dakahlia"), ("البحر الأحمر", "Red Sea"), ("البحيرة", "Beheira"),
        ("الفيوم", "Fayoum"), ("الغربية", "Gharbia"), ("الإسماعيلية", "Ismailia"),
        ("المنوفية", "Monofia"), ("المنيا", "Minya"), ("القليوبية", "Qalubia"),
        ("الوادي الجديد", "New Valley"), ("الشرقية", "Sharqia"), ("السويس", "Suez"),
        ("أسوان", "Aswan"), ("أسيوط", "Assiut"), ("بني سويف", "Beni Suef"),
        ("بورسعيد", "Port Said"), ("دمياط", "Damietta"), ("جنوب سيناء", "South Sinai"),
        ("كفر الشيخ", "Kafr El Sheikh"), ("مطروح", "Matrouh"), ("الأقصر", "Luxor"),
        ("قنا", "Qena"), ("شمال سيناء", "North Sinai"), ("سوهاج", "Sohag")
    ]
    
    for ar, en in governorates:
        cursor.execute("INSERT OR IGNORE INTO governorates (name, name_en) VALUES (?, ?)", (ar, en))
        gov_id = cursor.lastrowid
        
        # Seed capital city for each
        cursor.execute("INSERT OR IGNORE INTO cities (governorate_id, name, name_en) VALUES (?, ?, ?)", 
                       (gov_id, ar, en))

    logger.info("Egyptian Geography seed data applied.")
