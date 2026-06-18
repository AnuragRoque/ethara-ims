@echo off
echo ====================================================
echo   Starting Ethara Inventory Management System...
echo ====================================================
echo.

echo [1/2] Starting Backend API (FastAPI)...
start "Ethara Backend" cmd /k "cd backend && call .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo [2/2] Starting Frontend App (Vite/React)...
start "Ethara Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are starting in separate windows!
echo.
echo -> Backend API will be available at:  http://localhost:8000
echo -> Frontend App will be available at: http://localhost:5173
echo.
echo You can close this window now. The services will continue running in their respective windows.
pause
