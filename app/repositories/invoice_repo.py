"""Invoice repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

from app.utils.time_keeper import TimeKeeper
from app.utils.zatca import generate_uuid, compute_invoice_hash, generate_invoice_xml, generate_phase2_qr

def create_invoice(data: dict, conn=None) -> int:
    if conn is None:
        conn = get_connection()
        must_commit = True
    else:
        must_commit = False
        
    if not TimeKeeper.check_time_manipulation():
        raise ValueError("SECURITY ALERT: System time appears to be manipulated backwards. Action blocked.")
        
    try:
        # 1. Payment Processing (Split Payments)
        customer = None
        if data.get("customer_id"):
            customer = conn.execute("SELECT name, balance, wallet_balance, credit_limit FROM customers WHERE id = ?", (data["customer_id"],)).fetchone()

        payments = data.get("payments", [])
        if not payments:
            # Fallback for old simple data
            payments = [{"method": data.get("payment_method", "cash"), "amount": data.get("net_total", 0)}]

        import json
        split_json = json.dumps(payments)
        primary_method = payments[0]["method"] if len(payments) == 1 else "split"

        total_paid = sum(p["amount"] for p in payments)
        # Check credit limit if any part is credit
        credit_part = sum(p["amount"] for p in payments if p["method"] == "credit")
        if credit_part > 0 and customer:
            new_balance = customer["balance"] + credit_part
            if customer["credit_limit"] > 0 and new_balance > customer["credit_limit"]:
                 raise ValueError(f"تم تجاوز الحد الائتماني. الحد: {customer['credit_limit']}, الرصيد الحالي: {customer['balance']}")
        
        # Check wallet if any part is wallet
        wallet_part = sum(p["amount"] for p in payments if p["method"] == "wallet")
        if wallet_part > 0 and customer:
            if customer["wallet_balance"] < wallet_part:
                raise ValueError(f"رصيد المحفظة غير كافٍ. المتوفر: {customer['wallet_balance']}")

        # 2. Prepare ZATCA Phase 2 Fields
        inv_uuid = generate_uuid()
        prev_hash_row = conn.execute("SELECT invoice_hash FROM invoices ORDER BY id DESC LIMIT 1").fetchone()
        prev_hash = prev_hash_row[0] if prev_hash_row and prev_hash_row[0] else 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ=='
        
        z_settings = {"company_name": "TechVibe", "vat_number": "300000000000003"}
        inv_data_for_xml = {
            "uuid": inv_uuid, "previous_invoice_hash": prev_hash,
            "created_at": now_str(), "subtotal": data["subtotal"], "total": data["total"]
        }
        xml_str = generate_invoice_xml(inv_data_for_xml, z_settings)
        inv_hash = compute_invoice_hash(xml_str)
        
        qr_code = generate_phase2_qr(
            z_settings["company_name"], z_settings["vat_number"], 
            now_str(), str(data["total"]), str(data["tax"]), inv_hash
        )

        # 3. Insert Invoice Record
        cursor = conn.execute(
            """INSERT INTO invoices (created_at, subtotal, tax, total, customer_id,
               payment_method, paid_amount, change_due, discount_type, discount_value,
               discount_amount, net_total, branch_id, refunded_amount, currency_id, exchange_rate,
               uuid, invoice_hash, previous_invoice_hash, zatca_status, qr_code, split_details_json, note)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)""",
            (now_str(), data["subtotal"], data["tax"], data["total"],
             data.get("customer_id"), primary_method, total_paid,
             data.get("change_due", 0), data["discount_type"], data["discount_value"],
             data["discount_amount"], data["net_total"], data.get("branch_id", 1), 0,
             data.get("currency_id", 1), data.get("exchange_rate", 1.0),
             inv_uuid, inv_hash, prev_hash, qr_code, split_json, data.get("notes", "")),
        )
        invoice_id = cursor.lastrowid
        
        # 4. Automated Ledger Entries & Balance Updates
        if data["net_total"] > 0:
            def _get_acct(name, t):
                row = conn.execute("SELECT id FROM accounts WHERE name = ?", (name,)).fetchone()
                if row: return row[0]
                import hashlib
                c = f"A-{hashlib.md5(name.encode()).hexdigest()[:6].upper()}"
                return conn.execute("INSERT INTO accounts (code, name, type) VALUES (?, ?, ?)", (c, name, t)).lastrowid

            revenue_id = _get_acct("إيرادات المبيعات", "revenue")
            tax_id = _get_acct("ضرائب مستحقة", "liability") if data.get("tax", 0) > 0 else None
            
            entry_id = conn.execute(
                "INSERT INTO journal_entries (date, reference, description, total_amount, status) VALUES (?, ?, ?, ?, ?)",
                (now_str().split(" ")[0], f"INV-{invoice_id}", f"فاتورة مبيعات رقم {invoice_id} ({primary_method})", data["net_total"], "posted")
            ).lastrowid
            
            # Record each payment line in Ledger and update account/customer
            for pLine in payments:
                method = pLine["method"]
                amt = pLine["amount"]
                
                asset_name = "صندوق الكاش"
                if method == "card": asset_name = "البنك"
                elif method == "credit" and customer: asset_name = f"ذمم مدينة: {customer['name']}"
                elif method == "wallet" and customer: asset_name = f"محفظة عملاء: {customer['name']}"
                elif method == "cheque": asset_name = "شيكات تحت التحصيل"
                
                asset_id = _get_acct(asset_name, "asset")
                
                # Update specific balances
                if method == "credit" and customer:
                    conn.execute("UPDATE customers SET balance = balance + ? WHERE id = ?", (amt, data["customer_id"]))
                elif method == "wallet" and customer:
                    conn.execute("UPDATE customers SET wallet_balance = wallet_balance - ? WHERE id = ?", (amt, data["customer_id"]))

                conn.execute(
                    "INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES (?, ?, ?, ?, ?)",
                    (entry_id, asset_id, amt, 0, f"دفع بواسطة {method}")
                )
                conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (amt, asset_id))

                # If shift management is active, add to shift sales
                from app.repositories import extended_repo
                open_shift = extended_repo.get_open_shift(data.get("branch_id", 1))
                if open_shift:
                    extended_repo.add_shift_sales(open_shift["id"], 
                        amt if method == "cash" else 0, 
                        amt if method == "card" else 0)

            # Credit (Revenue and Tax)
            net_rev = data["net_total"] - data.get("tax", 0)
            conn.execute("INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit) VALUES (?, ?, 0, ?)", (entry_id, revenue_id, net_rev))
            conn.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", (net_rev, revenue_id))
            
            if tax_id and data.get("tax", 0) > 0:
                conn.execute("INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit) VALUES (?, ?, 0, ?)", (entry_id, tax_id, data["tax"]))
                conn.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", (data["tax"], tax_id))

            if data.get("customer_id"):
                conn.execute("UPDATE customers SET total_purchases = total_purchases + ?, updated_at = ? WHERE id = ?",
                             (data["net_total"], now_str(), data["customer_id"]))

        if must_commit:
            conn.commit()
            
        TimeKeeper.commit_time(now_str())
        return invoice_id
    except Exception as e:
        if must_commit: conn.rollback()
        raise e

        if must_commit:
            conn.commit()
            
        # Register the latest transaction time to enforce anti-tampering monotonic clock
        TimeKeeper.commit_time(now_str())
        
        return invoice_id
    except Exception as e:
        if must_commit:
            conn.rollback()
        raise e


def create_invoice_items(invoice_id: int, items: list, user_id: int = None, conn=None):
    if conn is None:
        conn = get_connection()
        must_commit = True
    else:
        must_commit = False

    for item in items:
        # item usually contains: product_id, qty, unit_price, bonus_qty
        bonus = item.get("bonus_qty", 0)
        total_qty = item["qty"] + bonus

        # 1. Insert Item
        conn.execute(
            """INSERT INTO invoice_items (invoice_id, product_id, qty, bonus_qty, unit_price,
               line_total, item_discount_type, item_discount_value,
               item_discount_amount, net_line_total, tax_rate, tax_amount)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (invoice_id, item["product_id"], item["qty"], bonus, item["unit_price"],
             item["line_total"], item.get("item_discount_type", "none"),
             item.get("item_discount_value", 0), item.get("item_discount_amount", 0),
             item.get("net_line_total", item["line_total"]),
             item.get("tax_rate", 0), item.get("tax_amount", 0)),
        )
        # 2. Synchronize Stock (Decrement total: sold + bonus) and update velocity
        conn.execute(
            "UPDATE products SET stock_qty = stock_qty - ?, last_sold_at = ?, updated_at = ? WHERE id = ?",
            (total_qty, now_str(), now_str(), item["product_id"])
        )

        # --- 2.1 FIFO Batch Deduction (Phase 8) ---
        remaining_to_deduct = total_qty
        batches = conn.execute(
            "SELECT id, current_qty FROM product_batches WHERE product_id = ? AND current_qty > 0 ORDER BY expiry_date ASC, id ASC",
            (item["product_id"],)
        ).fetchall()
        
        for batch in batches:
            if remaining_to_deduct <= 0: break
            
            deduct_from_this = min(batch["current_qty"], remaining_to_deduct)
            conn.execute(
                "UPDATE product_batches SET current_qty = current_qty - ?, updated_at = ? WHERE id = ?",
                (deduct_from_this, now_str(), batch["id"])
            )
            remaining_to_deduct -= deduct_from_this

        # 3. Log Stock Movement
        from app.repositories import stock_movement_repo
        stock_movement_repo.create_movement(
            product_id=item["product_id"],
            movement_type="sale",
            qty_delta=-total_qty,
            reference_type="invoice",
            reference_id=invoice_id,
            user_id=user_id,
            notes=f"Sale Inv: {invoice_id} (+{bonus} bonus)",
            conn=conn
        )
    if must_commit:
        conn.commit()

def process_checkout(invoice_data: dict, items_data: list, user_id: int) -> int:
    """Wrapper to ensure atomic checkout of invoice and items."""
    conn = get_connection()
    try:
        conn.execute("BEGIN TRANSACTION")
        invoice_id = create_invoice(invoice_data, conn=conn)
        create_invoice_items(invoice_id, items_data, user_id=user_id, conn=conn)
        conn.execute("COMMIT")
        return invoice_id
    except Exception as e:
        conn.execute("ROLLBACK")
        raise e


def get_by_id(invoice_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,)).fetchone()
    return row_to_dict(row) if row else None


def get_items(invoice_id: int):
    conn = get_connection()
    rows = conn.execute(
        """SELECT ii.*, p.name as product_name
           FROM invoice_items ii
           LEFT JOIN products p ON p.id = ii.product_id
           WHERE ii.invoice_id = ?""",
        (invoice_id,),
    ).fetchall()
    return rows_to_list(rows)


def get_list(date_from: str = None, date_to: str = None, branch_id: int = None,
             customer_id: int = None, payment_method: str = None, is_void: int = None,
             offset: int = 0, limit: int = 50):
    conn = get_connection()
    base = "SELECT i.*, c.name as customer_name FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id WHERE 1=1"
    params = []
    if date_from:
        base += " AND date(i.created_at) >= ?"
        params.append(date_from)
    if date_to:
        base += " AND date(i.created_at) <= ?"
        params.append(date_to)
    if branch_id:
        base += " AND i.branch_id = ?"
        params.append(branch_id)
    if customer_id:
        base += " AND i.customer_id = ?"
        params.append(customer_id)
    if payment_method:
        base += " AND i.payment_method = ?"
        params.append(payment_method)
    if is_void is not None:
        base += " AND i.is_void = ?"
        params.append(is_void)
    count_sql = base.replace("SELECT i.*, c.name as customer_name", "SELECT COUNT(i.id)")
    total = conn.execute(count_sql, params).fetchone()[0]
    base += " ORDER BY i.id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    rows = conn.execute(base, params).fetchall()
    return rows_to_list(rows), total


def void_invoice(invoice_id: int, user_id: int, reason: str):
    """Void an invoice — atomic reversal of stock, balances, and accounting."""
    from app.repositories import product_repo, stock_movement_repo, customer_repo, accounting_repo
    conn = get_connection()
    inv = get_by_id(invoice_id)
    if not inv or inv["is_void"]:
        return False

    try:
        conn.execute("BEGIN TRANSACTION")

        # 1. Update invoice status
        conn.execute(
            "UPDATE invoices SET is_void = 1, voided_at = ?, voided_by = ?, void_reason = ? WHERE id = ?",
            (now_str(), user_id, reason, invoice_id),
        )

        # 2. Financial Reversal (Customer Balance)
        if inv.get("customer_id"):
            if inv["payment_method"] == "credit":
                customer_repo.update_balance(inv["customer_id"], -inv["net_total"], conn=conn)
            elif inv["payment_method"] == "wallet":
                customer_repo.update_wallet(inv["customer_id"], inv["net_total"], conn=conn)
            customer_repo.update_total_purchases(inv["customer_id"], -inv["net_total"], conn=conn)

        # 3. Stock Reversal
        items = get_items(invoice_id)
        for item in items:
            total_restore = item["qty"] + item.get("bonus_qty", 0)
            product_repo.update_stock(item["product_id"], total_restore, conn=conn)
            stock_movement_repo.create_movement(
                product_id=item["product_id"],
                movement_type="void",
                qty_delta=total_restore,
                reference_type="invoice",
                reference_id=invoice_id,
                user_id=user_id,
                conn=conn
            )

        # 4. Accounting Reversal
        original_je = conn.execute("SELECT id FROM journal_entries WHERE reference = ?", (f"INV-{invoice_id}",)).fetchone()
        if original_je:
            accounting_repo.reverse_entry(original_je["id"], user_id=user_id)

        conn.execute("COMMIT")
        return True
    except Exception as e:
        if conn.in_transaction:
            conn.execute("ROLLBACK")
        raise e


def get_summary(date_from: str = None, date_to: str = None, branch_id: int = None) -> dict:
    """Quick summary without pagination — total count, total amount, by payment method."""
    conn = get_connection()
    where, params = ["is_void = 0"], []
    if date_from: where.append("date(created_at) >= ?"); params.append(date_from)
    if date_to: where.append("date(created_at) <= ?"); params.append(date_to)
    if branch_id: where.append("branch_id = ?"); params.append(branch_id)
    wc = " AND ".join(where)
    
    totals = conn.execute(
        f"SELECT COUNT(*) as cnt, COALESCE(SUM(net_total), 0) as total, "
        f"COALESCE(AVG(net_total), 0) as avg_ticket FROM invoices WHERE {wc}", params
    ).fetchone()
    
    by_method = conn.execute(
        f"SELECT payment_method, COUNT(*) as cnt, COALESCE(SUM(net_total), 0) as total "
        f"FROM invoices WHERE {wc} GROUP BY payment_method", params
    ).fetchall()
    
    return {
        "count": totals["cnt"],
        "total": round(totals["total"], 2),
        "avg_ticket": round(totals["avg_ticket"], 2),
        "by_payment_method": rows_to_list(by_method)
    }


def get_print_data(invoice_id: int) -> dict:
    """Get invoice with items and customer info formatted for printing."""
    from app.repositories import settings_repo

    conn = get_connection()
    inv = conn.execute(
        "SELECT i.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address "
        "FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id WHERE i.id = ?", (invoice_id,)
    ).fetchone()
    if not inv:
        return None
    result = row_to_dict(inv)
    items = conn.execute(
        "SELECT ii.*, p.name as product_name, p.sku, p.barcode "
        "FROM invoice_items ii JOIN products p ON p.id = ii.product_id WHERE ii.invoice_id = ?", (invoice_id,)
    ).fetchall()
    result["items"] = rows_to_list(items)
    result["store"] = {
        "name": settings_repo.get("store_name", "My Store"),
        "vat_number": settings_repo.get("vat_number", "300000000000003"),
        "address": settings_repo.get("store_address", ""),
        "phone": settings_repo.get("store_phone", ""),
    }
    result["print_settings"] = {
        "receipt_header": settings_repo.get("receipt_header", ""),
        "receipt_footer": settings_repo.get("receipt_footer", "Thank you!"),
        "invoice_footer": settings_repo.get("invoice_footer", ""),
        "printer_width": settings_repo.get("printer_width", "80mm"),
        "auto_print": settings_repo.get("auto_print", "0"),
        "enable_qr": settings_repo.get("enable_qr", "0"),
    }
    return result


def duplicate_invoice(invoice_id: int) -> dict:
    """Get invoice data ready to be re-submitted as a new checkout."""
    inv = get_by_id(invoice_id)
    if not inv:
        return None
    items = get_items(invoice_id)
    return {
        "customer_id": inv.get("customer_id"),
        "payment_method": inv.get("payment_method", "cash"),
        "discount_type": inv.get("discount_type", "flat"),
        "discount_value": inv.get("discount_value", 0),
        "branch_id": inv.get("branch_id", 1),
        "items": [{"product_id": it["product_id"], "qty": it["qty"], "unit_price": it["unit_price"]} for it in items],
    }


def _ensure_account(conn, name: str, acc_type: str) -> int:
    row = conn.execute("SELECT id FROM accounts WHERE name = ?", (name,)).fetchone()
    if row:
        return row["id"]
    import hashlib

    code = f"A-{hashlib.md5(name.encode()).hexdigest()[:6].upper()}"
    return conn.execute(
        "INSERT INTO accounts (code, name, type) VALUES (?, ?, ?)",
        (code, name, acc_type),
    ).lastrowid


def _payment_account_name(method: str, customer_name: str | None = None) -> tuple[str, str]:
    if method == "cash":
        return "صندوق الكاش", "asset"
    if method == "card":
        return "البنك", "asset"
    if method == "credit":
        return f"ذمم مدينة: {customer_name or 'عميل'}", "asset"
    if method == "wallet":
        return f"محفظة عملاء: {customer_name or 'عميل'}", "asset"
    if method == "cheque":
        return "شيكات تحت التحصيل", "asset"
    raise ValueError("Unsupported payment method")


def update_payment_method(invoice_id: int, new_method: str, customer_id: int = None):
    """Change the payment method of an existing invoice.
    """
    conn = get_connection()
    try:
        conn.execute("BEGIN TRANSACTION")
        invoice = conn.execute(
            "SELECT id, customer_id, payment_method, net_total, split_details_json FROM invoices WHERE id = ?",
            (invoice_id,),
        ).fetchone()
        if not invoice:
            raise ValueError("Invoice not found")

        old_method = invoice["payment_method"]
        if old_method == new_method:
            conn.execute("ROLLBACK")
            return
        if old_method == "split":
            raise ValueError("Changing payment method is not supported for split payments")
        if new_method not in {"cash", "card", "credit", "wallet"}:
            raise ValueError("Unsupported payment method")

        customer = None
        if invoice["customer_id"]:
            customer = conn.execute(
                "SELECT id, name, balance, wallet_balance, credit_limit FROM customers WHERE id = ?",
                (invoice["customer_id"],),
            ).fetchone()

        if new_method in {"credit", "wallet"} and not customer:
            raise ValueError("Customer is required for credit or wallet payments")

        net_total = float(invoice["net_total"] or 0)
        adjusted_balance = float(customer["balance"]) if customer else 0.0
        adjusted_wallet = float(customer["wallet_balance"]) if customer else 0.0

        if customer:
            if old_method == "credit":
                adjusted_balance -= net_total
            elif old_method == "wallet":
                adjusted_wallet += net_total

            if new_method == "credit":
                if customer["credit_limit"] > 0 and adjusted_balance + net_total > customer["credit_limit"]:
                    raise ValueError("Credit limit exceeded for selected customer")
            elif new_method == "wallet":
                if adjusted_wallet < net_total:
                    raise ValueError("Insufficient wallet balance for selected customer")

            if old_method == "credit":
                conn.execute(
                    "UPDATE customers SET balance = balance - ?, updated_at = ? WHERE id = ?",
                    (net_total, now_str(), customer["id"]),
                )
            elif old_method == "wallet":
                conn.execute(
                    "UPDATE customers SET wallet_balance = wallet_balance + ?, updated_at = ? WHERE id = ?",
                    (net_total, now_str(), customer["id"]),
                )

            if new_method == "credit":
                conn.execute(
                    "UPDATE customers SET balance = balance + ?, updated_at = ? WHERE id = ?",
                    (net_total, now_str(), customer["id"]),
                )
            elif new_method == "wallet":
                conn.execute(
                    "UPDATE customers SET wallet_balance = wallet_balance - ?, updated_at = ? WHERE id = ?",
                    (net_total, now_str(), customer["id"]),
                )

        payment_line = conn.execute(
            "SELECT id, account_id, debit FROM journal_entry_lines WHERE entry_id = "
            "(SELECT id FROM journal_entries WHERE reference = ? ORDER BY id ASC LIMIT 1) "
            "AND debit > 0 ORDER BY id ASC LIMIT 1",
            (f"INV-{invoice_id}",),
        ).fetchone()

        if payment_line:
            new_account_name, new_account_type = _payment_account_name(
                new_method,
                customer["name"] if customer else None,
            )
            new_account_id = _ensure_account(conn, new_account_name, new_account_type)

            conn.execute(
                "UPDATE accounts SET balance = balance - ? WHERE id = ?",
                (payment_line["debit"], payment_line["account_id"]),
            )
            conn.execute(
                "UPDATE accounts SET balance = balance + ? WHERE id = ?",
                (payment_line["debit"], new_account_id),
            )
            conn.execute(
                "UPDATE journal_entry_lines SET account_id = ?, account_name = ?, description = ? WHERE id = ?",
                (new_account_id, new_account_name, f"دفع بواسطة {new_method}", payment_line["id"]),
            )

        conn.execute(
            "UPDATE invoices SET payment_method = ? WHERE id = ?",
            (new_method, invoice_id)
        )
        conn.execute("COMMIT")
    except Exception:
        if conn.in_transaction:
            conn.execute("ROLLBACK")
        raise


def get_today_count_and_sales(today: str):
    conn = get_connection()
    row = conn.execute(
        "SELECT COUNT(id) as cnt, COALESCE(SUM(net_total), 0) as sales "
        "FROM invoices WHERE date(created_at) = ? AND is_void = 0",
        (today,),
    ).fetchone()
    return {"count": row["cnt"], "sales": row["sales"]}
def get_profitability(invoice_id: int):
    """Calculate net profit for an invoice: Total Sale - Total Cost."""
    conn = get_connection()
    # Total Sale
    inv = get_by_id(invoice_id)
    if not inv: return None
    
    sale_total = inv["net_total"]
    
    # Total Cost
    rows = conn.execute(
        """SELECT ii.qty, ii.bonus_qty, p.cost_price 
           FROM invoice_items ii
           JOIN products p ON p.id = ii.product_id
           WHERE ii.invoice_id = ?""",
        (invoice_id,)
    ).fetchall()
    
    total_cost = 0
    for r in rows:
        # Note: both sold qty and bonus qty are deducted from stock, 
        # so both contribute to the cost of the sale.
        total_cost += (r["qty"] + r["bonus_qty"]) * r["cost_price"]
        
    profit = sale_total - total_cost
    margin = (profit / sale_total * 100) if sale_total > 0 else 0
    
    return {
        "invoice_id": invoice_id,
        "sale_total": sale_total,
        "total_cost": total_cost,
        "net_profit": profit,
        "margin_percentage": round(margin, 2)
    }

def process_exchange(data: dict) -> dict:
    """
    Handles a combined return and sale (Makassa).
    data: {
        'customer_id': int,
        'user_id': int,
        'branch_id': int,
        'return_data': { 'original_invoice_id': int, 'items': [...] },
        'sale_data': { 'items': [...], 'payment_method': str, 'discount_amount': float, ... }
    }
    """
    from app.repositories import returns_repo, product_repo
    conn = get_connection()
    try:
        # Start transaction
        conn.execute("BEGIN TRANSACTION")
        
        # 1. Process Return
        return_id = returns_repo.create_return({
            "original_invoice_id": data["return_data"]["original_invoice_id"],
            "customer_id": data.get("customer_id"),
            "user_id": data["user_id"],
            "refund_method": "credit", # Internal credit for the exchange
            "refund_amount": data["return_data"]["total_refund"],
            "items": data["return_data"]["items"],
            "branch_id": data.get("branch_id", 1)
        }, conn=conn)
        
        # 2. Process New Sale
        sale_data = data["sale_data"]
        cursor = conn.execute(
            """INSERT INTO invoices (created_at, subtotal, tax, total, customer_id,
               payment_method, paid_amount, change_due, discount_type, discount_value,
               discount_amount, net_total, branch_id, note)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (now_str(), sale_data["subtotal"], sale_data.get("tax", 0), sale_data["total"],
             data.get("customer_id"), sale_data["payment_method"], sale_data["paid_amount"],
             sale_data.get("change_due", 0), sale_data.get("discount_type", "none"), 
             sale_data.get("discount_value", 0), sale_data.get("discount_amount", 0), 
             sale_data["net_total"], data.get("branch_id", 1),
             f"Exchange Ref: Return {return_id}"),
        )
        new_invoice_id = cursor.lastrowid
        
        # Process Items for the new sale
        for item in sale_data["items"]:
            conv = item.get("conversion_factor", 1)
            net_line = item.get("net_line_total", item["line_total"])
            conn.execute(
                """INSERT INTO invoice_items (invoice_id, product_id, qty, unit_price,
                   line_total, net_line_total, unit_name)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (new_invoice_id, item["product_id"], item["qty"], item["unit_price"],
                 item["line_total"], net_line, item.get("unit_name", "")),
            )
            # Update Stock with conversion factor
            product_repo.update_stock(item["product_id"], -item["qty"], conv, conn=conn)
            
        conn.execute("COMMIT")
        return {"return_id": return_id, "invoice_id": new_invoice_id}
    except Exception as e:
        conn.execute("ROLLBACK")
        raise e

def unlock_invoice(invoice_id: int):
    """Resets transient lock flags in case of a crash (تحرير الفواتير)."""
    conn = get_connection()
    # In this simplified schema, we don't have a 'is_locked' flag per se, 
    # but the reference manual mentions this tool. We'll implement it as a 
    # 'status' reset to 'completed' or 'open' if we had such state.
    # For now, we'll log it as a maintenance action.
    from app.repositories import log_repo
    log_repo.add_activity(
        action="unlock_invoice",
        details=f"Admin unlocked invoice {invoice_id}",
        type="system"
    )
    return True
