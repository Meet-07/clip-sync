@echo off
setlocal
cd /d "%~dp0\.."

if not exist server.pid (
    echo [INFO] No server.pid found. Attempting to locate ClipSync node process...
    powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*src/index.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host ('Stopped ClipSync process PID: ' + $_.ProcessId) }"
    echo [DONE] Any running ClipSync process has been stopped.
    pause
    exit /b 0
)

set /p PID=<server.pid

echo Stopping ClipSync service (PID %PID%)...
taskkill /PID %PID% /F /T >nul 2>&1
if errorlevel 1 (
    echo Process %PID% was not running. Cleaning up PID file...
) else (
    echo Successfully stopped ClipSync background service!
)

if exist server.pid del server.pid
echo.
if not "%1"=="--no-pause" pause
