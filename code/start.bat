@echo off
REM HackerRank Orchestrate - Auto Start Script
REM Starts backend and frontend automatically

echo.
echo ========================================================================
echo.
echo   ^|^|  HackerRank Orchestrate - Message Notification Router
echo   ^^o^^  Starting up...
echo.
echo ========================================================================
echo.

REM Get the directory where this script is located
setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"

REM Start Backend
echo [1/2] Starting Backend on port 8000...
echo.
cd /d "%SCRIPT_DIR%backend"
start "Backend - FastAPI" cmd /k python main.py

REM Wait for backend to start
timeout /t 3 /nobreak

echo.
echo [2/2] Starting Frontend on port 5173...
echo.
cd /d "%SCRIPT_DIR%frontend"
start "Frontend - React" cmd /k npm run dev

echo.
echo ========================================================================
echo.
echo   Dashboard: http://localhost:5173 (or 5174 if port busy)
echo   API Docs:  http://localhost:8000/docs
echo.
echo   Tip: Close these command windows to stop both services
echo.
echo ========================================================================
echo.
timeout /t 5 /nobreak

REM Open the dashboard in browser
echo Opening dashboard in browser...
start http://localhost:5173

REM Keep this window open for reference
cmd /k
