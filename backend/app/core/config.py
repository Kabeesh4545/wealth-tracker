from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator
from typing import List, Optional
import os
import warnings

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql+psycopg://postgres:password@localhost:5432/money_management"
    JWT_SECRET_KEY: Optional[str] = None
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
    CORS_ORIGIN_REGEX: Optional[str] = r"^(https:\/\/.*\.vercel\.app|http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?)$"
    
    # Rate Limiting Configuration (Section 4)
    LOGIN_RATE_LIMIT: int = 10
    LOGIN_RATE_WINDOW: int = 60
    ASSISTANT_RATE_LIMIT: int = 15
    ASSISTANT_RATE_WINDOW: int = 60

    model_config = ConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str]) -> str:
        if not v:
            return "postgresql+psycopg://postgres:password@localhost:5432/money_management"
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg://", 1)
        if v.startswith("postgresql://") and not v.startswith("postgresql+"):
            return v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v

    @property
    def SECRET_KEY(self) -> str:
        secret = self.JWT_SECRET_KEY
        weak_keys = {
            "secret", "password", "123456", "development-secret", "changeme", 
            "723b7b3f9ebbc7b265bb6d58129de9d96bcaea9b5f548003f56eb71c89fcf2cf"
        }
        
        is_production = self.ENVIRONMENT.strip().lower() == "production"
        
        if not secret:
            if is_production:
                raise RuntimeError("JWT_SECRET_KEY must be configured in production environment.")
            else:
                return "723b7b3f9ebbc7b265bb6d58129de9d96bcaea9b5f548003f56eb71c89fcf2cf"
        
        if secret.strip().lower() in weak_keys:
            if is_production:
                raise RuntimeError("Weak JWT_SECRET_KEY is rejected in production environment.")
            else:
                warnings.warn("A weak JWT_SECRET_KEY is being used for development.")
        
        return secret

    @property
    def cors_origins_list(self) -> List[str]:
        # Validate that origins parse correctly and prevent wildcards in production with credentials
        origins = [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]
        is_production = self.ENVIRONMENT.strip().lower() == "production"
        if is_production and "*" in origins:
            raise RuntimeError("CORS wildcard origin '*' is prohibited in production configuration.")
        return origins

settings = Settings()

# Fail fast checks at startup for production (Section 26)
def fail_fast_production_check(cfg: Settings):
    is_production = cfg.ENVIRONMENT.strip().lower() == "production"
    if is_production:
        # 1. JWT Secret Validation
        secret = cfg.JWT_SECRET_KEY
        if not secret:
            raise RuntimeError("Production JWT secret configuration is invalid.")
            
        weak_keys = {
            "secret", "password", "123456", "development-secret", "changeme", 
            "723b7b3f9ebbc7b265bb6d58129de9d96bcaea9b5f548003f56eb71c89fcf2cf",
            "your-secret-key"
        }
        if secret.strip().lower() in weak_keys or len(secret.strip()) < 16:
            raise RuntimeError("Production JWT secret configuration is invalid.")
            
        # 2. Database URL Validation (Must be PostgreSQL)
        db_url = cfg.DATABASE_URL
        if not db_url:
            raise RuntimeError("Production database connection is invalid.")
            
        valid_schemes = ["postgresql://", "postgresql+psycopg://", "postgresql+asyncpg://"]
        if not any(db_url.startswith(scheme) for scheme in valid_schemes):
            raise RuntimeError("Production database connection is invalid.")
            
        # 3. CORS Allowed Origins Validation
        origins_str = cfg.CORS_ALLOWED_ORIGINS
        if not origins_str:
            raise RuntimeError("CORS_ALLOWED_ORIGINS must be configured in production environment.")
        origins = [o.strip() for o in origins_str.split(",") if o.strip()]
        if not origins or "*" in origins:
            raise RuntimeError("CORS wildcard origin '*' is prohibited in production configuration.")

fail_fast_production_check(settings)
