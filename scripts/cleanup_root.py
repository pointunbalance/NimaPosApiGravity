"""
Root Directory Cleanup Script
Moves debug files, logs, and scratch files to organized directories.
"""
import os
import shutil
from pathlib import Path

ROOT = Path(__file__).parent.parent
DEBUG_DIR = ROOT / "debug"
LOGS_DIR = ROOT / "logs"

# Files to move to debug/
DEBUG_FILES = [
    "debug_import.log",
    "debug_login.py",
    "debug_qc.py",
    "debug_trace.txt",
    "debug_trace2.txt",
    "server_debug_log.txt",
    "api_error.log",
    "api_startup.log",
    "server_stdout.log",
    "server_stdout2.log",
    "api-dev.err.log",
    "api-dev.out.log",
    "frontend-dev.err.log",
    "frontend-dev.out.log",
    "frontend-5173.err.log",
    "frontend-5173.out.log",
    "error_log.txt",
    "Gaps_Audit.txt",
    "activation_key_ignore.txt",
]

# Files to move to logs/
LOG_FILES = [
    "pytest.log",
    "pytest_out.txt",
    "pytest_out2.txt",
    "pytest_out_clean.txt",
    "pytest_clean.txt",
    "pytest_final.log",
    "pytest_output.txt",
    "pytest_restored.log",
]

# Root test files (move to tests/scratch/)
ROOT_TEST_FILES = [
    "test_crm.py",
    "test_fleet.py",
    "test_hr.py",
    "test_imports.py",
    "test_integrity.py",
    "test_projects.py",
    "test_qc.py",
    "test_screens.py",
    "test_ui_kit.py",
    "test_zatca.py",
    "run_auth_test.py",
]

# Scripts that belong in scripts/
SCRIPT_FILES = [
    "check_db_tables.py",
    "check_schema.py",
    "check_sql.py",
    "dump_schema.py",
    "patch_hr.py",
    "patch_projects.py",
    "patch_zatca.py",
    "verify_geography.py",
]


def ensure_dirs():
    """Create target directories."""
    DEBUG_DIR.mkdir(exist_ok=True)
    LOGS_DIR.mkdir(exist_ok=True)
    (ROOT / "tests" / "scratch").mkdir(exist_ok=True)


def move_file(src: Path, dst_dir: Path):
    """Move a file if it exists."""
    if src.exists():
        dst = dst_dir / src.name
        if not dst.exists():
            shutil.move(str(src), str(dst))
            print(f"  [OK] Moved {src.name} -> {dst_dir.name}/")
        else:
            print(f"  [SKIP] {src.name} (already in {dst_dir.name}/)")


def main():
    print("NimaPOS Root Directory Cleanup")
    print("=" * 50)

    ensure_dirs()

    print("\nMoving debug files...")
    for f in DEBUG_FILES:
        move_file(ROOT / f, DEBUG_DIR)

    print("\nMoving log files...")
    for f in LOG_FILES:
        move_file(ROOT / f, LOGS_DIR)

    print("\nMoving root test files...")
    for f in ROOT_TEST_FILES:
        move_file(ROOT / f, ROOT / "tests" / "scratch")

    print("\nMoving script files...")
    for f in SCRIPT_FILES:
        move_file(ROOT / f, ROOT / "scripts")

    # Fix backsup typo
    backsup = ROOT / "backsup"
    backups = ROOT / "backups"
    if backsup.exists() and not backups.exists():
        shutil.move(str(backsup), str(backups))
        print("\n[DONE] Fixed typo: backsup/ -> backups/")
    elif backsup.exists():
        print("\n[WARN] Both backsup/ and backups/ exist. Manual merge needed.")

    print("\n" + "=" * 50)
    print("Cleanup complete!")


if __name__ == "__main__":
    main()
