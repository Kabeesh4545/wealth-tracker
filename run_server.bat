@echo off
title Antigravity Money - Live Server & Tunnel Launcher
echo ===================================================
echo   Antigravity Money - Starting Full-Stack Server
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting FastAPI Backend on Port 8000...
start "Antigravity Backend" cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Cloudflare Public Tunnel...
echo.
echo ===================================================
echo Keep this window open while your friends or users
echo are accessing the app!
echo ===================================================
echo.
cloudflared.exe tunnel --url http://127.0.0.1:8000
