@echo off
title Antigravity Money - Full-Stack Server & Resilient Tunnel
echo ================================================================
echo   Antigravity Money - Full-Stack Production Server
echo ================================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting FastAPI Backend on Port 8000...
start "Antigravity Backend API" cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Resilient Cloudflare Tunnel with Auto-Reconnect...
echo.
echo ================================================================
echo   PERMANENT LOCAL WI-FI LINK (Never expires, 0 latency):
echo   http://10.58.18.219:8000
echo.
echo   PUBLIC INTERNET LINK: Look below for https://*.trycloudflare.com
echo ================================================================
echo.

:tunnel_loop
echo [%time%] Starting Cloudflare tunnel connection...
cloudflared.exe tunnel --url http://127.0.0.1:8000
echo.
echo [%time%] Tunnel disconnected. Reconnecting in 3 seconds...
timeout /t 3 /nobreak >nul
goto tunnel_loop
