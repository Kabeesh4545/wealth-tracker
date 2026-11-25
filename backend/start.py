import os
import sys
import subprocess

def main():
    port = int(os.environ.get("PORT", "8000"))
    
    print("==> Initializing database schema...")
    try:
        from app.database.connection import engine
        from app.database.base import Base
        Base.metadata.create_all(bind=engine)
        print("==> Database tables verified/created successfully.")
    except Exception as e:
        print(f"Warning: Table initialization encountered: {e}")

    print("==> Running Alembic database migrations...")
    try:
        subprocess.run(["alembic", "upgrade", "head"], check=False)
    except Exception as e:
        print(f"Warning: Alembic migration encountered: {e}")

    print("==> Seeding initial benchmark costs and data sources...")
    try:
        subprocess.run([sys.executable, "-m", "seed.seed_database"], check=False)
    except Exception as e:
        print(f"Warning: Seeding encountered: {e}")

    print(f"==> Starting Uvicorn FastAPI server on 0.0.0.0:{port}...")
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, proxy_headers=True, forwarded_allow_ips="*")

if __name__ == "__main__":
    main()
