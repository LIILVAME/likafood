#!/bin/bash

# LikaFood MVP Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Environments: local, staging, production
# Actions: build, start, stop, restart, logs, clean

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-local}
ACTION=${2:-start}

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "All requirements satisfied."
}

setup_environment() {
    log_info "Setting up environment for $ENVIRONMENT..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warning "Created .env file from .env.example. Please update it with your values."
        else
            log_error ".env file not found and no .env.example available."
            exit 1
        fi
    fi
    
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            log_warning "Created backend/.env file from backend/.env.example. Please update it with your values."
        else
            log_error "backend/.env file not found and no backend/.env.example available."
            exit 1
        fi
    fi
}

build_images() {
    log_info "Building Docker images..."
    docker-compose build --no-cache
    log_success "Docker images built successfully."
}

start_services() {
    log_info "Starting services..."
    docker-compose up -d
    
    log_info "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        log_success "Services started successfully."
        log_info "Frontend: http://localhost:80"
        log_info "Backend API: http://localhost:3000"
        log_info "MongoDB: localhost:27017"
    else
        log_error "Some services failed to start. Check logs with: ./deploy.sh $ENVIRONMENT logs"
        exit 1
    fi
}

stop_services() {
    log_info "Stopping services..."
    docker-compose down
    log_success "Services stopped successfully."
}

restart_services() {
    log_info "Restarting services..."
    stop_services
    start_services
}

show_logs() {
    log_info "Showing logs..."
    docker-compose logs -f
}

clean_up() {
    log_info "Cleaning up..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    log_success "Cleanup completed."
}

show_status() {
    log_info "Service status:"
    docker-compose ps
}

show_help() {
    echo "LikaFood MVP Deployment Script"
    echo ""
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  local      - Local development (default)"
    echo "  staging    - Staging environment"
    echo "  production - Production environment"
    echo ""
    echo "Actions:"
    echo "  build      - Build Docker images"
    echo "  start      - Start services (default)"
    echo "  stop       - Stop services"
    echo "  restart    - Restart services"
    echo "  logs       - Show service logs"
    echo "  status     - Show service status"
    echo "  clean      - Clean up containers and volumes"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 local start"
    echo "  $0 production build"
    echo "  $0 staging logs"
}

# Main execution
case $ACTION in
    "build")
        check_requirements
        setup_environment
        build_images
        ;;
    "start")
        check_requirements
        setup_environment
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_up
        ;;
    "help")
        show_help
        ;;
    *)
        log_error "Unknown action: $ACTION"
        show_help
        exit 1
        ;;
esac