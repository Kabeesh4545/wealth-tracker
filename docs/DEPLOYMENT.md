# Production Deployment, Configuration & Backup Strategy

This document provides technical instructions for configuring, deploying, and backing up the application in a production environment.

---

## 1. Production Environment Variables

Before launching, configure the backend environment variables. The application checks these variables at startup and will fail to boot if any are missing or insecure when `ENVIRONMENT=production` is set.

| Environment Variable | Production Requirement | Example Value |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Must be `production` to activate strict checks. | `production` |
| `DATABASE_URL` | PostgreSQL connection string. SQLite is rejected in production. | `postgresql://mm_user:secure_password@prod-db:5432/money_db` |
| `JWT_SECRET_KEY` | Must be a strong, random key of at least 16 characters. Weak keys are rejected. | `c3a8868f-f3ab-4c90-a3a6-b2d5f63fb213` |
| `CORS_ALLOWED_ORIGINS` | Explicit trusted frontend domains separated by commas. | `https://app.money.example.com` |
| `OPENAI_API_KEY` | Server-side OpenAI API key. Must not be exposed. | `sk-proj-xyz...` |
| `AI_ASSISTANT_MODEL` | Target OpenAI GPT model. | `gpt-4o-mini` |

---

## 2. Deployment Procedure

### A. Database Configurations
1. **Migrations**: Apply database migrations to construct the production PostgreSQL schema:
   ```bash
   cd backend
   alembic upgrade head
   ```
2. **Local Cost Seeding**: Run the database seeder to populate local cost estimate benchmarks:
   ```bash
   python seed/seed_database.py
   ```

### B. Backend Production Server Launch
1. **Dependencies**: Install Python packages:
   ```bash
   pip install -r requirements.txt
   ```
2. **Process Server**: Run the FastAPI application using Gunicorn with Uvicorn workers:
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
   ```

### C. Frontend Compilation & Hosting
1. **API URL Override**: Set the production backend URL (so Vite compiles it instead of defaulting to localhost):
   ```bash
   export VITE_API_BASE_URL="https://api.money.example.com"
   ```
2. **Compile Assets**: Run the build script to generate static HTML, CSS, and JS files:
   ```bash
   npm run build
   ```
3. **Static Hosting**: Deploy the `/dist` directory to a static hosting provider (e.g., Nginx, Netlify, Cloudflare Pages). Ensure all routes are redirected to `index.html` to support React client-side routing.

---

## 3. Database Least Privilege & Backup Strategy

### PostgreSQL Application Role
Do not connect the FastAPI backend using the database superuser account (`postgres`). Create a dedicated application role with limited permissions:
```sql
CREATE USER mm_app_user WITH PASSWORD 'secure_app_password';
GRANT CONNECT ON DATABASE money_db TO mm_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mm_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mm_app_user;
```

### Database Backups (`pg_dump`)
Configure a daily cron job to back up the database:
```bash
pg_dump -U mm_app_user -h prod-db -d money_db -F c -b -v -f /backups/money_db_$(date +%F).dump
```
- **Frequency**: Daily at 02:00 UTC.
- **Retention**: Keep daily backups for 30 days, weekly backups for 12 weeks, and monthly backups for 1 year.
- **Storage**: Store backup files in encrypted, version-controlled object storage buckets.

### Restoration Procedure
To restore a backup file to a clean database:
```bash
pg_restore -U mm_app_user -h prod-db -d money_db -v /backups/money_db_YYYY-MM-DD.dump
```

---

## 4. Production Security Hardening

### Rate Limiting Configuration
The application uses an in-memory `SimpleLimiter` to mitigate brute-force and spam attacks. If scaled horizontally across multiple servers, this should be replaced with a shared rate-limiting store (such as Redis) to track request counts globally.
- **Login Endpoint**: 10 requests / minute / IP
- **AI Chat Endpoint**: 15 requests / minute / IP

### HTTP Headers & HSTS
- **HSTS**: `Strict-Transport-Security` is active for production deployments to enforce HTTPS.
- **Headers**: Production API responses include the following headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Cache-Control: no-store` (for authenticated endpoints)
