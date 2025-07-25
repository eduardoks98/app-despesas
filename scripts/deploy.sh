#!/bin/bash

# App Despesas - Production Deployment Script
# This script handles the deployment of the application using Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="app-despesas"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

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
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        log_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        log_warning "Please update .env file with your configuration before continuing"
        exit 1
    fi
    
    log_success "Requirements check passed"
}

backup_database() {
    log_info "Creating database backup..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Check if MySQL container is running
    if docker-compose ps mysql | grep -q "Up"; then
        # Create database backup
        docker-compose exec -T mysql mysqldump \
            -u ${DB_USER:-despesas_user} \
            -p${DB_PASSWORD:-userpassword} \
            ${DB_NAME:-app_despesas} > "$BACKUP_DIR/db_backup_$DATE.sql"
        
        log_success "Database backup created: $BACKUP_DIR/db_backup_$DATE.sql"
    else
        log_warning "MySQL container not running, skipping database backup"
    fi
}

build_images() {
    log_info "Building Docker images..."
    
    # Build all images
    docker-compose build --no-cache
    
    log_success "Docker images built successfully"
}

deploy_application() {
    log_info "Deploying application..."
    
    # Stop existing containers
    docker-compose down
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_service_health
    
    log_success "Application deployed successfully"
}

check_service_health() {
    log_info "Checking service health..."
    
    # Check database
    for i in {1..30}; do
        if docker-compose exec -T mysql mysqladmin ping -h localhost --silent; then
            log_success "Database is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "Database health check failed"
            exit 1
        fi
        sleep 2
    done
    
    # Check API
    for i in {1..30}; do
        if curl -f http://localhost:3001/health &> /dev/null; then
            log_success "API is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "API health check failed"
            exit 1
        fi
        sleep 2
    done
    
    # Check Web
    for i in {1..30}; do
        if curl -f http://localhost:3000 &> /dev/null; then
            log_success "Web application is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "Web application health check failed"
            exit 1
        fi
        sleep 2
    done
}

run_migrations() {
    log_info "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations (if migration script exists)
    if docker-compose exec -T api test -f "dist/database/migrate.js"; then
        docker-compose exec -T api node dist/database/migrate.js
        log_success "Database migrations completed"
    else
        log_warning "No migration script found, skipping migrations"
    fi
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove old backups (keep last 7 days)
    find "$BACKUP_DIR" -name "db_backup_*.sql" -mtime +7 -delete 2>/dev/null || true
    
    log_success "Cleanup completed"
}

show_status() {
    log_info "Application Status:"
    echo
    docker-compose ps
    echo
    log_info "Application URLs:"
    echo "  Web App: http://localhost:3000"
    echo "  API:     http://localhost:3001"
    echo "  Health:  http://localhost:3001/health"
    echo
    log_info "Logs:"
    echo "  View logs: docker-compose logs -f"
    echo "  API logs:  docker-compose logs -f api"
    echo "  Web logs:  docker-compose logs -f web"
}

# Main deployment process
main() {
    log_info "Starting deployment of $PROJECT_NAME..."
    echo
    
    # Parse command line arguments
    case "${1:-deploy}" in
        "deploy")
            check_requirements
            backup_database
            build_images
            deploy_application
            run_migrations
            cleanup_old_images
            show_status
            ;;
        "backup")
            backup_database
            ;;
        "build")
            check_requirements
            build_images
            ;;
        "health")
            check_service_health
            ;;
        "status")
            show_status
            ;;
        "stop")
            log_info "Stopping application..."
            docker-compose down
            log_success "Application stopped"
            ;;
        "logs")
            docker-compose logs -f
            ;;
        "clean")
            log_warning "This will remove all containers, volumes, and images. Are you sure? (y/N)"
            read -r response
            if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
                docker-compose down -v --rmi all
                cleanup_old_images
                log_success "Environment cleaned"
            else
                log_info "Clean operation cancelled"
            fi
            ;;
        *)
            echo "Usage: $0 {deploy|backup|build|health|status|stop|logs|clean}"
            echo
            echo "Commands:"
            echo "  deploy  - Full deployment (default)"
            echo "  backup  - Create database backup only"
            echo "  build   - Build Docker images only"
            echo "  health  - Check service health"
            echo "  status  - Show application status"
            echo "  stop    - Stop all services"
            echo "  logs    - Show application logs"
            echo "  clean   - Remove all containers and images"
            exit 1
            ;;
    esac
    
    log_success "Operation completed successfully!"
}

# Run main function with all arguments
main "$@"