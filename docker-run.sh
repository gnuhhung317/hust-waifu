#!/bin/bash

# HUST Chat Application Docker Management Script

echo "🎓 HUST Chat Application Docker Management"
echo "=========================================="

# Function to build and start all services
start_services() {
    echo "🚀 Building and starting all services..."
    docker-compose up --build -d
    
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    
    echo "📋 Checking service status..."
    docker-compose ps
    
    echo ""
    echo "✅ Services are starting up!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📚 API Docs: http://localhost:8000/docs"
}

# Function to stop services
stop_services() {
    echo "🛑 Stopping all services..."
    docker-compose down
    echo "✅ All services stopped!"
}

# Function to show logs
show_logs() {
    echo "📄 Showing logs for all services..."
    docker-compose logs -f
}

# Function to rebuild services
rebuild_services() {
    echo "🔄 Rebuilding all services..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo "✅ Services rebuilt and started!"
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Build and start all services"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  logs      Show logs from all services"
    echo "  rebuild   Rebuild and restart all services"
    echo "  status    Show status of services"
    echo "  help      Show this help message"
    echo ""
    echo "If no command is provided, services will be started."
}

# Function to show status
show_status() {
    echo "📊 Service Status:"
    docker-compose ps
}

# Function to restart services
restart_services() {
    echo "🔄 Restarting all services..."
    docker-compose restart
    echo "✅ Services restarted!"
}

# Main script logic
case "${1:-start}" in
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "logs")
        show_logs
        ;;
    "rebuild")
        rebuild_services
        ;;
    "restart")
        restart_services
        ;;
    "status")
        show_status
        ;;
    "help")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        show_help
        exit 1
        ;;
esac
