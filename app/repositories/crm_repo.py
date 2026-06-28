import logging
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

logger = logging.getLogger(__name__)

# ── Segments ──
def create_segment(name: str, criteria_json: str) -> int:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO crm_segments (name, criteria_json, created_at) VALUES (?, ?, ?)",
        (name, criteria_json, now_str())
    )
    conn.commit()
    logger.info(f"Created CRM Segment: {name}")
    return cursor.lastrowid

def get_segments() -> list[dict]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM crm_segments ORDER BY id DESC").fetchall()
    return rows_to_list(rows)

# ── Campaigns ──
def create_campaign(name: str, type: str, segment_id: int, message_template: str, scheduled_at: str = None) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO crm_campaigns 
           (name, type, segment_id, message_template, scheduled_at, created_at) 
           VALUES (?, ?, ?, ?, ?, ?)""",
        (name, type, segment_id, message_template, scheduled_at, now_str())
    )
    conn.commit()
    logger.info(f"Created CRM Campaign: {name}")
    return cursor.lastrowid

def get_campaigns() -> list[dict]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM crm_campaigns ORDER BY id DESC").fetchall()
    return rows_to_list(rows)

def execute_campaign(campaign_id: int):
    """Mock execution logic that flips a campaign status to 'completed'."""
    conn = get_connection()
    conn.execute(
        "UPDATE crm_campaigns SET status = 'completed' WHERE id = ?",
        (campaign_id,)
    )
    conn.commit()
    logger.info(f"Campaign {campaign_id} executed successfully.")

# ── Interactions (Touchpoints) ──
def log_interaction(customer_id: int, type: str, notes: str, user_id: int) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO crm_interactions 
           (customer_id, type, notes, user_id, created_at) 
           VALUES (?, ?, ?, ?, ?)""",
        (customer_id, type, notes, user_id, now_str())
    )
    conn.commit()
    return cursor.lastrowid

def get_customer_history(customer_id: int) -> list[dict]:
    """Get all interactions and sales history for a 360 view."""
    conn = get_connection()
    interactions = conn.execute(
        """SELECT i.*, u.username as agent_name 
           FROM crm_interactions i
           LEFT JOIN users u ON i.user_id = u.id
           WHERE i.customer_id = ? 
           ORDER BY i.created_at DESC""",
        (customer_id,)
    ).fetchall()
    return rows_to_list(interactions)

def evaluate_customer_tiers():
    """Batch job to update customer tiers based on `total_spent`."""
    conn = get_connection()
    # Simple tiering logic: > 10,000 = VIP, > 5000 = Gold, > 1000 = Silver, Else Bronze
    conn.execute("UPDATE customers SET tier = 'VIP' WHERE total_spent >= 10000")
    conn.execute("UPDATE customers SET tier = 'Gold' WHERE total_spent >= 5000 AND total_spent < 10000")
    conn.execute("UPDATE customers SET tier = 'Silver' WHERE total_spent >= 1000 AND total_spent < 5000")
    conn.execute("UPDATE customers SET tier = 'Bronze' WHERE total_spent < 1000")
    conn.commit()
    logger.info("Successfully evaluated bounding tiers for all customers.")
