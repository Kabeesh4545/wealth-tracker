#!/usr/bin/env bash
set -e

echo "==> Running Alembic database migrations..."
alembic upgrade head

echo "==> Seeding initial benchmark costs and data sources..."
python -m seed.seed_database || true

echo "==> Starting Uvicorn FastAPI server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
