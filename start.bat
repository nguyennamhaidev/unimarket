@echo off
echo ==========================================
echo    KHOI DONG UNIMARKET - SINH VIEN PASS DO
echo ==========================================
start "UniMarket Backend (Port 5000)" cmd /k "cd backend && npm start"
start "UniMarket Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"
echo Da mo ca 2 cua so Backend va Frontend!
echo Truy cap http://localhost:5173 tren trinh duyet de su dung.
pause