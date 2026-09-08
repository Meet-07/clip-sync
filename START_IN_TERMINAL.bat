@echo off
setlocal
cd /d "%~dp0server"

echo ========================================================
echo   Starting ClipSync in Terminal Mode (Visible Logs)
echo ========================================================

node src/index.js

echo.
pause
