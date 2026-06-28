import logging
from datetime import datetime, timezone
import sqlite3
from typing import Optional

logger = logging.getLogger(__name__)

class TimeKeeper:
    """
    Ensures that critical operations (like invoices and shifts) only happen
    if the system OS clock has not been maliciously set backward.
    """

    _last_known_time: Optional[datetime] = None

    @classmethod
    def initialize(cls, conn: sqlite3.Connection):
        """
        Reads the absolute maximum timestamp across critical tables (e.g. invoices)
        during system startup to establish a baseline.
        """
        try:
            # We look at the most recent invoice created to establish the latest known time.
            row = conn.execute("SELECT MAX(created_at) as max_time FROM invoices").fetchone()
            if row and row["max_time"]:
                # Convert the ISO string from sqlite to datetime object.
                cls._last_known_time = datetime.fromisoformat(row["max_time"])
                logger.info(f"TimeKeeper initialized. Last known DB time: {cls._last_known_time.isoformat()}")
            else:
                cls._last_known_time = datetime.now()
                logger.info("TimeKeeper initialized (No previous data found).")
        except Exception as e:
            logger.error(f"Failed to initialize TimeKeeper. {e}")
            cls._last_known_time = datetime.now()

    @classmethod
    def check_time_manipulation(cls) -> bool:
        """
        Returns True if the current system time is valid (>= last known time).
        Returns False if the system time appears to have been rolled back significantly.
        """
        if not cls._last_known_time:
            return True # Not initialized

        current_time = datetime.now()
        
        # If the current clock is strictly older than the last recorded event in the database
        if current_time < cls._last_known_time:
            logger.warning(
                f"SECURITY ALERT: OS Time Tampering Detected! "
                f"Current OS Time ({current_time.isoformat()}) is older than "
                f"the last recorded database transaction ({cls._last_known_time.isoformat()})."
            )
            return False
            
        return True

    @classmethod
    def commit_time(cls, new_time_str: str):
        """
        Updates the monotonically increasing time tracker after a successful transaction.
        """
        try:
            new_time = datetime.fromisoformat(new_time_str)
            if not cls._last_known_time or new_time > cls._last_known_time:
                cls._last_known_time = new_time
        except ValueError:
            pass # Invalid format, ignore.
