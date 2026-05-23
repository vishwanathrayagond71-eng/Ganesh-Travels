@echo off
title Tours and Tour Starter
echo ===================================================
echo   Starting Tours & Tour Server and Public Tunnel
echo ===================================================
echo.

:: Start Node.js Server in a new window
echo 🚀 Starting local Node.js server...
start "Tours & Tour - Node.js Server" cmd /k "node server.js"

:: Wait 3 seconds for the server to spin up
echo ⏳ Waiting for server to initialize...
timeout /t 3 >nul

:: Start Cloudflare Tunnel in a new window
echo 🌐 Starting Cloudflare public tunnel...
start "Tours & Tour - Public Tunnel" cmd /k "cloudflared.exe tunnel --url http://localhost:3000"

echo.
echo ===================================================
echo   Success! Check the new windows for links.
echo   To stop, simply close the opened terminal windows.
echo ===================================================
pause
