"""
VeriBhoomi AI — Complete Full-Stack Multi-Service Runner
Launches:
1. Mock State LRMS Gateway (Port 8002)
2. ML & OCR Pipeline Microservice (Port 8001)
3. FastAPI Backend Service (Port 8000)
4. React Vite Frontend (Port 5173)
"""
import sys
import os
import subprocess
import time
import signal
import webbrowser

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

def start_services():
    print("=" * 70)
    print("          VERIBHOOMI AI — FULL-STACK PLATFORM RUNNER")
    print("   Intelligent Land Record Digitization & Validation System")
    print("=" * 70)

    # 1. First ensure sample scans and database are seeded and synchronized with Supabase
    print("\n[1/5] Initializing Sample Scans & Seeding Database...")
    subprocess.run([sys.executable, os.path.join(ROOT_DIR, "sample-data", "generate_sample_scans.py")], check=True)
    subprocess.run([sys.executable, os.path.join(ROOT_DIR, "backend", "scripts", "seed_data.py")], check=True)
    try:
        print("\n[*] Synchronizing Maharashtra Land Records to Supabase Cloud Database...")
        subprocess.run([sys.executable, os.path.join(ROOT_DIR, "backend", "scripts", "sync_to_supabase.py")], check=False)
    except Exception as e:
        print(f"[!] Supabase sync notice: {e}")

    processes = []

    try:
        # 2. Start Mock LRMS on port 8002
        print("\n[2/5] Starting Mock State LRMS / DILRMP Gateway on :8002...")
        p_lrms = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "main:app", "--port", "8002", "--host", "127.0.0.1"],
            cwd=os.path.join(ROOT_DIR, "mock-lrms")
        )
        processes.append(("Mock LRMS", p_lrms))

        # 3. Start ML Service on port 8001
        print("\n[3/5] Starting ML & OCR Pipeline Microservice on :8001...")
        p_ml = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8001", "--host", "127.0.0.1"],
            cwd=os.path.join(ROOT_DIR, "ml-service")
        )
        processes.append(("ML Service", p_ml))

        # 4. Start Backend on port 8000
        print("\n[4/5] Starting FastAPI Core Backend on :8000...")
        p_backend = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000", "--host", "127.0.0.1"],
            cwd=os.path.join(ROOT_DIR, "backend")
        )
        processes.append(("Backend", p_backend))

        # 5. Start Frontend on port 5173
        print("\n[5/5] Starting React Vite Frontend on :5173...")
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        p_frontend = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=os.path.join(ROOT_DIR, "frontend")
        )
        processes.append(("Frontend", p_frontend))

        time.sleep(3)
        print("\n" + "=" * 70)
        print(" ALL VERIBHOOMI AI SERVICES ARE RUNNING!")
        print("=" * 70)
        print(" Frontend UI:        http://localhost:5173")
        print(" Backend API Docs:   http://localhost:8000/docs")
        print(" ML Pipeline Docs:   http://localhost:8001/docs")
        print(" Mock LRMS Gateway:  http://localhost:8002/docs")
        print("-" * 70)
        print(" DEPARTMENT USER ACCOUNTS (Pre-configured):")
        print("   - Operator:  operator@veribhoomi.gov  (Password: password)")
        print("   - Officer:   officer@veribhoomi.gov   (Password: password)")
        print("   - Admin:     admin@veribhoomi.gov     (Password: password)")
        print("=" * 70)
        print("\nPress Ctrl+C to stop all services.\n")

        # Keep alive
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nShutting down all VeriBhoomi AI services...")
        for name, p in processes:
            p.terminate()
        print("All services stopped.")

if __name__ == "__main__":
    start_services()
