@echo off
title Wealth Tracker - 24/7 Full-Stack Server
echo ================================================================
echo   Wealth Tracker - Full-Stack Production Server
echo ================================================================
echo.

cd /d "%~dp0"

echo [1/3] Building latest production frontend...
call npm run build

echo [2/3] Starting FastAPI Backend on Port 8000...
start "Wealth Tracker Backend API" cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo [3/3] Launching Permanent Fixed Subdomain Tunnel & Cloudflare Tunnel...
echo.
echo ================================================================
echo   PERMANENT FIXED SUBDOMAIN (Fixed URL forever):
echo   https://wealth-tracker-kabeesh.loca.lt
echo   Tunnel Password (If prompted once): 157.51.67.188
echo.
echo   LOCAL WI-FI NETWORK LINK (Direct LAN, 0 latency):
echo   http://10.129.85.177:8000
echo.
echo   CLOUDFLARE PUBLIC TUNNEL:
echo ================================================================
echo.

start "Wealth Tracker Fixed Tunnel" cmd /k "npx --yes localtunnel --port 8000 --subdomain wealth-tracker-kabeesh"

:tunnel_loop
echo [%time%] Starting Cloudflare tunnel connection...
cloudflared.exe tunnel --url http://127.0.0.1:8000
echo.
echo [%time%] Tunnel disconnected. Reconnecting in 3 seconds...
timeout /t 3 /nobreak >nul
goto tunnel_loop
