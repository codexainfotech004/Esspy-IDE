"""
Auto-restarting backend wrapper.
Restarts the Flask backend automatically if it crashes.
"""
import subprocess
import sys
import time
import os

script = os.path.join(os.path.dirname(__file__), 'backend', 'app.py')

print("=== ESPY Backend Auto-Restart Wrapper ===")
print(f"Watching: {script}")
print("Press Ctrl+C to stop.\n")

restart_count = 0
while True:
    print(f"[Wrapper] Starting backend (attempt #{restart_count + 1})...")
    proc = subprocess.run([sys.executable, script])
    restart_count += 1
    if proc.returncode == 0:
        print("[Wrapper] Backend exited cleanly. Stopping.")
        break
    print(f"[Wrapper] Backend crashed (exit code {proc.returncode}). Restarting in 3s...")
    time.sleep(3)
