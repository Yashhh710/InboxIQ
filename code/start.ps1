# HackerRank Orchestrate - Auto Start Script
# Starts backend and frontend automatically

Write-Host "🚀 Starting HackerRank Orchestrate..." -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "⚙️  Starting Backend on port 8000..." -ForegroundColor Yellow
$backendProcess = Start-Process -PassThru -NoNewWindow -WorkingDirectory "$scriptDir\backend" -FileName "python" -ArgumentList "main.py"
Write-Host "✅ Backend started (PID: $($backendProcess.Id))" -ForegroundColor Green

# Wait for backend to start
Write-Host "⏳ Waiting for backend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Check if backend is responding
$maxRetries = 10
$retry = 0
while ($retry -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ Backend is ready!" -ForegroundColor Green
        break
    }
    catch {
        $retry++
        if ($retry -lt $maxRetries) {
            Write-Host "⏳ Waiting... ($retry/$maxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
}

if ($retry -eq $maxRetries) {
    Write-Host "⚠️  Warning: Backend may not have started properly. Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

# Start Frontend
Write-Host "🎨 Starting Frontend on port 5173/5174..." -ForegroundColor Yellow
Start-Process -NoNewWindow -WorkingDirectory "$scriptDir\frontend" -FileName "npm" -ArgumentList "run dev"
Write-Host "✅ Frontend starting..." -ForegroundColor Green

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🌐 Dashboard will open shortly at:" -ForegroundColor Cyan
Write-Host "   📱 http://localhost:5173 (or 5174 if port busy)" -ForegroundColor Green
Write-Host ""
Write-Host "📚 API Documentation:" -ForegroundColor Cyan
Write-Host "   📖 http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Press Ctrl+C in terminal to stop both services" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Keep script running
Write-Host "✨ Both services are running. Press Ctrl+C to stop." -ForegroundColor Cyan
Read-Host "Press Enter to exit"
