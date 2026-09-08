@echo off
setlocal
cd /d "%~dp0\.."

echo ========================================================
echo   Launching ClipSync Silent Background Service...
echo ========================================================

wscript.exe "%~dp0start-silent.vbs"
ping 127.0.0.1 -n 3 >nul

node "%~dp0status.js"

if not "%1"=="--no-pause" pause
