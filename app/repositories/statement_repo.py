from app.database.connection import get_connection
from app.utils.helpers import rows_to_list, now_str

def get_entity_statement(entity_id: int, entity_type: str, date_from: str = None, date_to: str = None):
    conn = get_connection()
    
    # Identify entity table and account direction
    if entity_type == "customer":
        entity_name_sql = "SELECT name, opening_balance FROM customers WHERE id = ?"
        # Customer: Debit (Invoice) increases balance, Credit (Voucher/Return) decreases it
    else:
        entity_name_sql = "SELECT name, opening_balance FROM suppliers WHERE id = ?"
        # Supplier: Credit (Purchase) increases balance, Debit (Voucher/Return) decreases it

    entity_row = conn.execute(entity_name_sql, (entity_id,)).fetchone()
    if not entity_row:
        return None
    
    entity_name = entity_row[0]
    opening_bal = entity_row[1] or 0
    
    entries = []
    
    # 1. Opening Balance Entry
    entries.append({
        "date": "2000-01-01", # Semantic start
        "type": "opening_balance",
        "reference_id": 0,
        "description": "Initial Opening Balance",
        "debit": opening_bal if entity_type == "customer" else 0,
        "credit": opening_bal if entity_type == "supplier" else 0,
    })

    # 2. Invoices (Sales for Customer, Purchases for Supplier)
    if entity_type == "customer":
        inv_sql = "SELECT id, created_at as date, 'invoice' as type, net_total as amount FROM invoices WHERE customer_id = ? AND is_void = 0"
    else:
        inv_sql = "SELECT id, date, 'purchase' as type, total_amount as amount FROM purchases WHERE supplier_id = ?"
    
    params = [entity_id]
    if date_from: inv_sql += " AND created_at >= ?"; params.append(date_from)
    if date_to: inv_sql += " AND created_at <= ?"; params.append(date_to + " 23:59:59")
    
    for row in conn.execute(inv_sql, params).fetchall():
        entries.append({
            "date": row["date"],
            "type": row["type"],
            "reference_id": row["id"],
            "description": f"{row['type'].capitalize()} #{row['id']}",
            "debit": row["amount"] if entity_type == "customer" else 0,
            "credit": row["amount"] if entity_type == "supplier" else 0,
        })

    # 3. Returns
    if entity_type == "customer":
        ret_sql = "SELECT id, created_at as date, 'return' as type, refund_amount as amount FROM returns WHERE customer_id = ?"
    else:
        ret_sql = "SELECT id, date, 'supplier_return' as type, total_amount as amount FROM supplier_returns WHERE supplier_id = ?"
    
    params = [entity_id]
    for row in conn.execute(ret_sql, params).fetchall():
        entries.append({
            "date": row["date"],
            "type": row["type"],
            "reference_id": row["id"],
            "description": f"Refund/Return #{row['id']}",
            "debit": 0 if entity_type == "customer" else row["amount"],
            "credit": row["amount"] if entity_type == "customer" else 0,
        })

    # 4. Vouchers (Payments/Discounts/Opening)
    vouch_sql = "SELECT id, date, type, amount, notes FROM financial_vouchers WHERE entity_id = ? AND entity_type = ?"
    params = [entity_id, entity_type]
    for row in conn.execute(vouch_sql, params).fetchall():
        v_type = row["type"]
        amount = row["amount"]
        debit = 0; credit = 0
        
        # Mapping logic based on accounting standards
        if entity_type == "customer":
            # Customer (Receivable): 
            # Opening Balance/Debit adjustment -> Debit
            # Payment/Credit adjustment/Discount -> Credit
            if v_type in ["opening_balance", "debit_note"]:
                debit = amount
            else: # payment_received, discount_allowed, credit_note
                credit = amount
        else:
            # Supplier (Payable):
            # Opening Balance/Credit adjustment -> Credit
            # Payment/Debit adjustment/Discount -> Debit
            if v_type in ["opening_balance", "credit_note"]:
                credit = amount
            else: # payment_made, discount_earned, debit_note
                debit = amount
            
        entries.append({
            "date": row["date"],
            "type": f"voucher_{v_type}",
            "reference_id": row["id"],
            "description": row["notes"] or f"Voucher ({v_type})",
            "debit": debit,
            "credit": credit,
        })

    # Sort and Compute Balance
    entries.sort(key=lambda x: x["date"])
    
    running_balance = 0
    total_debit = 0
    total_credit = 0
    
    for entry in entries:
        total_debit += entry["debit"]
        total_credit += entry["credit"]
        # For statement: Balance = Debit - Credit
        running_balance += (entry["debit"] - entry["credit"])
        entry["balance"] = round(running_balance, 2)

    return {
        "entity_id": entity_id,
        "entity_name": entity_name,
        "entity_type": entity_type,
        "entries": entries,
        "total_debit": round(total_debit, 2),
        "total_credit": round(total_credit, 2),
        "final_balance": round(running_balance, 2)
    }
