import os
import time
import threading
import logging
import gzip
import sqlite3
from typing import Optional
from app.config import DATA_DIR, BACKUP_DIR, DB_PATH

logger = logging.getLogger(__name__)

class AutoBackupService:
    _thread: Optional[threading.Thread] = None
    _stop_event = threading.Event()
    
    # Configuration: Run backup every 2 hours
    INTERVAL_SECONDS = 7200
    
    @classmethod
    def start(cls):
        if cls._thread and cls._thread.is_alive():
            return
            
        cls._stop_event.clear()
        cls._thread = threading.Thread(target=cls._run_loop, daemon=True, name="BackupServiceThread")
        cls._thread.start()
        logger.info("AutoBackupService started in background.")

    @classmethod
    def stop(cls):
        if cls._thread:
            logger.info("AutoBackupService stopping...")
            cls._stop_event.set()
            cls._thread.join(timeout=5)

    @classmethod
    def _run_loop(cls):
        """Runs the loop indefinitely until stopped, performing backups periodically."""
        # Wait a bit after startup before the first backup (~2 mins)
        if cls._stop_event.wait(timeout=120):
            return
            
        while not cls._stop_event.is_set():
            try:
                cls.execute_backup()
            except Exception as e:
                logger.error(f"AutoBackupService encountered an error: {e}", exc_info=True)
                
            # Wait for next interval or stop event
            if cls._stop_event.wait(timeout=cls.INTERVAL_SECONDS):
                break

    @classmethod
    def execute_backup(cls, manual=False) -> str:
        """
        Takes a live, consistent snapshot of the active db using the SQLite Backup API.
        Then compresses it. 
        """
        os.makedirs(BACKUP_DIR, exist_ok=True)
        
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        prefix = "manual" if manual else "auto"
        
        # Temp sqlite backup file
        temp_backup_db = os.path.join(BACKUP_DIR, f"temp_{timestamp}.db")
        final_backup_gz = os.path.join(BACKUP_DIR, f"pos_backup_{prefix}_{timestamp}.db.gz")
        
        try:
            # 1. Use the SQLite Backup API for a consistent snapshot
            # Connect to active DB
            source_conn = sqlite3.connect(DB_PATH, uri=True)
            # Create a destination connection
            dest_conn = sqlite3.connect(temp_backup_db)
            
            with source_conn, dest_conn:
                # 5MB pages per step is a good balance over locking limits
                source_conn.backup(dest_conn, pages=2000)
                
            source_conn.close()
            dest_conn.close()
            
            # 2. Compress the snapshot to save disk space
            with open(temp_backup_db, 'rb') as f_in:
                with gzip.open(final_backup_gz, 'wb') as f_out:
                    f_out.writelines(f_in)
                    
            # 3. Clean up the uncompressed temp snapshot
            os.remove(temp_backup_db)
                    
            logger.info(f"Database backup succeeded: {final_backup_gz}")
            
            cls._prune_old_backups()
            
            return final_backup_gz
            
        except sqlite3.Error as e:
            logger.error(f"SQLite DB Backup failed: {e}")
            if os.path.exists(temp_backup_db):
                os.remove(temp_backup_db)
            raise e

    @classmethod
    def _prune_old_backups(cls):
        """Removes backups older than 14 days to preserve disk space."""
        try:
            now = time.time()
            retention_seconds = 14 * 24 * 60 * 60 # 14 days
            
            for filename in os.listdir(BACKUP_DIR):
                if not filename.endswith(".db.gz"):
                    continue
                    
                file_path = os.path.join(BACKUP_DIR, filename)
                file_age = now - os.path.getmtime(file_path)
                
                if file_age > retention_seconds:
                    os.remove(file_path)
                    logger.info(f"Pruned old backup: {filename}")
        except Exception as e:
            logger.error(f"Failed to prune backups: {e}")
