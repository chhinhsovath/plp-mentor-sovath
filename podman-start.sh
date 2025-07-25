#!/bin/bash

# Podman Desktop Auto-Start Script for PLP Mentoring Platform
# This script builds and starts the containers automatically

echo "🚀 Starting PLP Mentoring Platform with Podman..."

# Function to check if Podman is running
check_podman() {
    if ! podman info >/dev/null 2>&1; then
        echo "❌ Podman is not running. Please start Podman Desktop first."
        exit 1
    fi
    echo "✅ Podman is running"
}

# Function to clean up old containers
cleanup() {
    echo "🧹 Cleaning up old containers..."
    podman-compose down 2>/dev/null || true
    podman container prune -f 2>/dev/null || true
}

# Function to build and start containers
start_services() {
    echo "🔨 Building and starting services..."
    
    # Build and start with podman-compose
    if podman-compose up -d --build; then
        echo "✅ Services started successfully!"
    else
        echo "❌ Failed to start services"
        exit 1
    fi
}

# Function to wait for services to be healthy
wait_for_health() {
    echo "⏳ Waiting for services to be healthy..."
    
    # Wait up to 2 minutes for backend
    for i in {1..24}; do
        if podman exec mentoring-backend-mock wget --quiet --tries=1 --spider http://localhost:3000/api/v1/auth/login 2>/dev/null; then
            echo "✅ Backend is healthy"
            break
        fi
        echo -n "."
        sleep 5
    done
    
    # Wait up to 2 minutes for frontend
    for i in {1..24}; do
        if podman exec mentoring-frontend wget --quiet --tries=1 --spider http://localhost:5173 2>/dev/null; then
            echo "✅ Frontend is healthy"
            break
        fi
        echo -n "."
        sleep 5
    done
}

# Function to display status
show_status() {
    echo ""
    echo "📊 Service Status:"
    podman ps --filter "label=com.docker.compose.project=plp-mentor-sovath"
    
    echo ""
    echo "🌐 Access URLs:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend API: http://localhost:3000"
    echo ""
    echo "📝 Default login credentials:"
    echo "   Username: chhinhs"
    echo "   Password: password"
}

# Main execution
main() {
    check_podman
    cleanup
    start_services
    wait_for_health
    show_status
    
    echo ""
    echo "✨ PLP Mentoring Platform is ready!"
    echo "💡 To view logs: podman-compose logs -f"
    echo "🛑 To stop: podman-compose down"
}

# Run main function
main