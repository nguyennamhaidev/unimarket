Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   KHOI DONG HE THONG UNIMARKET" -ForegroundColor Green
Write-Host "   San Thuong Mai Dien Tu Pass Do Sinh Vien" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# Start Backend
Write-Host "[1/2] Dang khoi dong Backend Server tai http://localhost:5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start"

# Start Frontend
Write-Host "[2/2] Dang khoi dong Frontend tai http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "Da khoi dong ca 2 server thanh cong!" -ForegroundColor Cyan
Write-Host "Truy cap trinh duyet tai: http://localhost:5173" -ForegroundColor Yellow