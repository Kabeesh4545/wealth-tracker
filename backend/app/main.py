from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging
import uuid
import time
import os

from app.core.config import settings
from app.database.connection import Base, engine, get_db
import app.models  # noqa: F401

class RequestIdFilter(logging.Filter):
    def filter(self, record):
        if not hasattr(record, "request_id"):
            record.request_id = "N/A"
        return True

# Setup logging
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] [ReqID: %(request_id)s] %(message)s"))
handler.addFilter(RequestIdFilter())

logging.basicConfig(
    level=logging.INFO,
    handlers=[handler]
)
logger = logging.getLogger("money_management")

# Auto-create tables if not present
Base.metadata.create_all(bind=engine)

from app.routers import (
    auth_router,
    profile_router,
    loans_router,
    planned_expenses_router,
    expenses_router,
    savings_router,
    investments_router,
    goals_router,
    goal_contributions_router,
    investment_profile_router,
    local_costs_router,
    planning_router,
    investment_allocation_router,
    financial_simulator_router,
    financial_assistant_router,
    market_trends_router
)

app = FastAPI(
    title="Wealth Tracker - API Backend",
    description="Production-quality FastAPI backend for Wealth Tracker personal finance and live 24/7 market trend intelligence.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip Compression to drastically speed up asset transfers (e.g. 900KB JS -> 230KB)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security and Correlation middleware (Section 10, 16, 19)
@app.middleware("http")
async def add_security_headers_and_correlation(request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id

    # Configure contextual logging filter
    old_factory = logging.getLogRecordFactory()
    def record_factory(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        record.request_id = request_id
        return record
    logging.setLogRecordFactory(record_factory)

    start_time = time.time()
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        
        # Log safe info only (no Authorization header, no body content)
        logger.info(
            f"Method: {request.method} | Path: {request.url.path} | "
            f"Status: {response.status_code} | Duration: {duration:.4f}s"
        )
        
        # Inject standard security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Restrictive CSP with support for modern SPA styling and charts
        response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; frame-ancestors 'none';"
        
        # Cache-Control Security Header for sensitive APIs (Section 6)
        sensitive_paths = [
            "/api/profile", "/api/expenses", "/api/loans", "/api/savings", 
            "/api/investments", "/api/goals", "/api/planning", "/api/simulator", 
            "/api/assistant", "/api/investment-profile", "/api/planned-expenses"
        ]
        path = request.url.path
        if any(path.startswith(p) for p in sensitive_paths):
            response.headers["Cache-Control"] = "no-store"
        elif path.startswith("/assets/"):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        elif path == "/" or path.endswith(".html"):
            response.headers["Cache-Control"] = "no-cache"
            
        # Strict-Transport-Security (Section 9)
        is_production = settings.ENVIRONMENT.strip().lower() == "production"
        if is_production and (request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https"):
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as exc:
        duration = time.time() - start_time
        logger.error(
            f"Method: {request.method} | Path: {request.url.path} | "
            f"Failed after {duration:.4f}s | Error: {str(exc)}",
            exc_info=True
        )
        logging.setLogRecordFactory(old_factory)
        
        if isinstance(exc, HTTPException):
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
                headers=getattr(exc, "headers", None)
            )
        if isinstance(exc, RequestValidationError):
            return JSONResponse(
                status_code=422,
                content={"detail": exc.errors()}
            )
            
        # Return generic safe 500 error directly (Section 15, 16)
        response = JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "request_id": request_id
            }
        )
        # Inject standard security headers even on failure path
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
        response.headers["X-Request-ID"] = request_id
        return response
    finally:
        logging.setLogRecordFactory(old_factory)

# Global safe 500 error exception handler (Section 15, 16)
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    request_id = getattr(request.state, "request_id", "N/A")
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None)
        )
    if isinstance(exc, RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors()}
        )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "request_id": request_id
        }
    )

# Include API routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(loans_router)
app.include_router(planned_expenses_router)
app.include_router(expenses_router)
app.include_router(savings_router)
app.include_router(investments_router)
app.include_router(goals_router)
app.include_router(goal_contributions_router)
app.include_router(investment_profile_router)
app.include_router(local_costs_router)
app.include_router(planning_router)
app.include_router(investment_allocation_router)
app.include_router(financial_simulator_router)
app.include_router(financial_assistant_router)
app.include_router(market_trends_router)

@app.get("/health", tags=["Health Check"])
def health_check():
    return {"status": "ok"}

@app.get("/ready", tags=["Health Check"])
def readiness_check(db: Session = Depends(get_db)):
    try:
        # Verify connectivity using simple parameterized execution
        db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connectivity check failed."
        )

dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "dist"))
if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API endpoints or docs or static assets
        if full_path.startswith(("api", "docs", "redoc", "openapi.json", "health", "ready", "assets")):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(dist_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))

@app.get("/", tags=["Health Check"])
def read_root():
    dist_index = os.path.join(dist_dir, "index.html")
    if os.path.exists(dist_index):
        return FileResponse(dist_index)
    return {
        "status": "healthy",
        "message": "Wealth Tracker API is running.",
        "docs": "/docs"
    }
