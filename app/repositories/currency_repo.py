"""Currency repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

def get_all(is_active: int = None):
    conn = get_connection()
    sql = "SELECT * FROM currencies"
    params = []
    if is_active is not None:
        sql += " WHERE is_active = ?"
        params.append(is_active)
    rows = conn.execute(sql, params).fetchall()
    return rows_to_list(rows)

def get_by_id(c_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM currencies WHERE id = ?", (c_id,)).fetchone()
    return row_to_dict(row) if row else None

def get_by_code(code: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM currencies WHERE code = ?", (code,)).fetchone()
    return row_to_dict(row) if row else None

def create(data: dict) -> int:
    conn = get_connection()
    try:
        if data.get("is_base"):
            conn.execute("UPDATE currencies SET is_base = 0") # Only one base
        
        cursor = conn.execute(
            """INSERT INTO currencies (code, name, symbol, exchange_rate, is_base, is_active, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (data["code"].upper(), data["name"], data.get("symbol"), data.get("exchange_rate", 1.0),
             1 if data.get("is_base") else 0, 1 if data.get("is_active") else 0, now_str())
        )
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        raise e

def update(c_id: int, data: dict):
    conn = get_connection()
    try:
        if data.get("is_base"):
            conn.execute("UPDATE currencies SET is_base = 0")
        
        fields, values = [], []
        for k in ("code", "name", "symbol", "exchange_rate", "is_base", "is_active"):
            if k in data and data[k] is not None:
                fields.append(f"{k} = ?")
                values.append(data[k])
        
        if not fields: return
        
        fields.append("updated_at = ?")
        values.append(now_str())
        values.append(c_id)
        
        conn.execute(f"UPDATE currencies SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e

def convert(amount: float, from_currency_id: int, to_currency_id: int) -> float:
    """Utility to convert amounts between currencies."""
    from_curr = get_by_id(from_currency_id)
    to_curr = get_by_id(to_currency_id)
    if not from_curr or not to_curr:
        return amount
        
    # Standardize to base currency first (amount / from_rate) * to_rate
    base_amount = amount / from_curr["exchange_rate"]
    return base_amount * to_curr["exchange_rate"]

def sync_rates_from_external_api():
    """Simulates/Implements currency rate synchronization."""
    conn = get_connection()
    # Mock data: In a real scenario, this would call an external API (e.g., Fixer.io, OpenExchangeRates)
    import random
    currencies = get_all()
    try:
        conn.execute("BEGIN TRANSACTION")
        for c in currencies:
            if c["is_base"]: continue
            # Simulate a 1-5% change
            change = random.uniform(-0.05, 0.10) # Weighted slightly towards inflation
            new_rate = round(c["exchange_rate"] * (1 + change), 4)
            conn.execute("UPDATE currencies SET exchange_rate = ?, updated_at = ? WHERE id = ?", (new_rate, now_str(), c["id"]))
        conn.execute("COMMIT")
        return True
    except Exception as e:
        conn.execute("ROLLBACK")
        raise e
