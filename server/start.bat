@echo off
echo ========================================
echo   QR Attendance System - Backend Server
echo ========================================
echo.

if not exist .env (
    echo [ERROR] .env file not found!
    echo.
    echo Please create a .env file with:
    echo   MONGO_URI=your_mongodb_atlas_connection_string
    echo   JWT_SECRET=your_secret_key
    echo   PORT=5000
    echo.
    echo See START_SERVER.md for instructions.
    pause
    exit /b 1
)

echo Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting server...
echo.
npm start
