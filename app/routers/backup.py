"""Backup router — Create and list backups."""
import os
import shutil
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from app.models.common import ApiResponse
from app.middleware.auth_middleware import require_role
from app.config import DB_PATH, BACKUP_DIR
from app.database.connection import get_connection

router = APIRouter(prefix="/backup", tags=["System & Settings"])
logger = logging.getLogger(__name__)


@router.post("/create", response_model=ApiResponse, summary="Create backup")
def create_backup(user: dict = Depends(require_role(["owner"]))):
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"pos_backup_{ts}.db"
    os.makedirs(BACKUP_DIR, exist_ok=True)
    backup_path = os.path.join(BACKUP_DIR, backup_name)
    try:
        shutil.copy2(DB_PATH, backup_path)
    except Exception as e:
        logger.error(f"Backup creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Backup creation failed")
    size = os.path.getsize(backup_path)
    return ApiResponse(ok=True, data={"filename": backup_name, "size_bytes": size, "path": backup_path})


@router.get("/list", response_model=ApiResponse, summary="List backups")
def list_backups(user: dict = Depends(require_role(["owner"]))):
    if not os.path.exists(BACKUP_DIR):
        return ApiResponse(ok=True, data=[])
    files = []
    for f in sorted(os.listdir(BACKUP_DIR), reverse=True):
        if f.endswith(".db"):
            path = os.path.join(BACKUP_DIR, f)
            files.append({"filename": f, "size_bytes": os.path.getsize(path),
                          "created_at": datetime.fromtimestamp(os.path.getmtime(path)).isoformat()})
    return ApiResponse(ok=True, data=files)

@router.post("/restore", response_model=ApiResponse, summary="Restore backup")
def restore_backup(payload: dict, user: dict = Depends(require_role(["owner"]))):
    filename = payload.get("filename")
    if not filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    try:
        # Prevent Path Traversal by ensuring only files in BACKUP_DIR are accessed
        safe_filename = os.path.basename(filename)
        backup_path = os.path.abspath(os.path.normpath(os.path.join(BACKUP_DIR, safe_filename)))
        backup_root = os.path.abspath(BACKUP_DIR)
        
        if not backup_path.startswith(backup_root) or not os.path.exists(backup_path):
             raise HTTPException(status_code=404, detail="Backup file not found or access denied")

        # Note: In a real production environment with active connections, 
        # replacing the DB file while in use might require stopping the server/connection pool.
        # For SQLite, it usually works if no write lock is active, but proceed with caution.
        shutil.copy2(backup_path, DB_PATH)
        return ApiResponse(ok=True, data={"message": f"Successfully restored {safe_filename}"})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Backup restore failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Restore failed")

@router.post("/maintenance", response_model=ApiResponse, summary="Run DB Maintenance (VACUUM & ANALYZE)")
def run_maintenance(user: dict = Depends(require_role(["owner", "admin"]))):
    try:
        conn = get_connection()
        # Ensure we are not in a transaction block
        conn.commit()
        conn.execute("VACUUM")
        conn.execute("ANALYZE")
        # Re-commit just in case
        conn.commit()
        
        # Optimize size
        size_bytes = os.path.getsize(DB_PATH)
        return ApiResponse(ok=True, data={
            "message": "Database maintenance completed successfully (VACUUM & ANALYZE)",
            "db_size_bytes": size_bytes
        })
    except Exception as e:
        logger.error(f"Database maintenance failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Maintenance failed")
