# HUST Chat Application Docker Management Script for Windows
# Usage: .\docker-run.ps1 [command]

param(
    [Parameter(Position=0)]
    [string]$Command = "start"
)

Write-Host "🎓 HUST Chat Application Docker Management" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

function Start-Services {
    Write-Host "🚀 Building and starting all services..." -ForegroundColor Green
    docker-compose up --build -d
    
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host "📋 Checking service status..." -ForegroundColor Blue
    docker-compose ps
    
    Write-Host ""
    Write-Host "✅ Services are starting up!" -ForegroundColor Green
    Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
}

function Stop-Services {
    Write-Host "🛑 Stopping all services..." -ForegroundColor Red
    docker-compose down
    Write-Host "✅ All services stopped!" -ForegroundColor Green
}

function Show-Logs {
    Write-Host "📄 Showing logs for all services..." -ForegroundColor Blue
    docker-compose logs -f
}

function Rebuild-Services {
    Write-Host "🔄 Rebuilding all services..." -ForegroundColor Yellow
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    Write-Host "✅ Services rebuilt and started!" -ForegroundColor Green
}

function Show-Help {
    Write-Host "Usage: .\docker-run.ps1 [COMMAND]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  start     Build and start all services" -ForegroundColor Gray
    Write-Host "  stop      Stop all services" -ForegroundColor Gray
    Write-Host "  restart   Restart all services" -ForegroundColor Gray
    Write-Host "  logs      Show logs from all services" -ForegroundColor Gray
    Write-Host "  rebuild   Rebuild and restart all services" -ForegroundColor Gray
    Write-Host "  status    Show status of services" -ForegroundColor Gray
    Write-Host "  help      Show this help message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "If no command is provided, services will be started." -ForegroundColor White
}

function Show-Status {
    Write-Host "📊 Service Status:" -ForegroundColor Blue
    docker-compose ps
}

function Restart-Services {
    Write-Host "🔄 Restarting all services..." -ForegroundColor Yellow
    docker-compose restart
    Write-Host "✅ Services restarted!" -ForegroundColor Green
}

# Main script logic
switch ($Command.ToLower()) {
    "start" {
        Start-Services
    }
    "stop" {
        Stop-Services
    }
    "logs" {
        Show-Logs
    }
    "rebuild" {
        Rebuild-Services
    }
    "restart" {
        Restart-Services
    }
    "status" {
        Show-Status
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "❌ Unknown command: $Command" -ForegroundColor Red
        Show-Help
        exit 1
    }
}
