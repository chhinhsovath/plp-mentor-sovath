# Makefile for PLP Mentoring Platform with Podman Desktop

.PHONY: help start stop restart build clean logs status install

# Default target
help:
	@echo "PLP Mentoring Platform - Podman Commands"
	@echo "========================================"
	@echo "make start    - Build and start all services"
	@echo "make stop     - Stop all services"
	@echo "make restart  - Restart all services"
	@echo "make build    - Build containers without starting"
	@echo "make clean    - Remove containers and volumes"
	@echo "make logs     - View logs from all services"
	@echo "make status   - Show service status"
	@echo "make install  - Install for Podman Desktop auto-start"

# Start services
start:
	@echo "Starting PLP Mentoring Platform..."
	@./podman-start.sh

# Stop services
stop:
	@echo "Stopping services..."
	@podman-compose -f podman-compose-autostart.yml down

# Restart services
restart: stop start

# Build only
build:
	@echo "Building containers..."
	@podman-compose -f podman-compose-autostart.yml build

# Clean everything
clean:
	@echo "Cleaning up containers and volumes..."
	@podman-compose -f podman-compose-autostart.yml down -v
	@podman image prune -f

# View logs
logs:
	@podman-compose -f podman-compose-autostart.yml logs -f

# Show status
status:
	@echo "Service Status:"
	@podman-compose -f podman-compose-autostart.yml ps

# Install for auto-start
install:
	@echo "Installing PLP Platform for Podman Desktop..."
	@echo "1. Copy this directory to Podman Desktop extensions folder"
	@echo "2. Or use the compose file directly in Podman Desktop"
	@echo "3. Enable 'restart: always' policy for auto-start"
	@echo ""
	@echo "Compose file: $(PWD)/podman-compose-autostart.yml"