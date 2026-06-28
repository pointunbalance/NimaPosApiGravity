import traceback
import sys
import os

sys.path.append(os.getcwd())

try:
    print("Testing app import...")
    from app.main import app
    print("SUCCESS")
except Exception:
    traceback.print_exc()
