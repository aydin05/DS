#!/bin/bash
set -e

# ============================================
# Server-side Deploy Script
# Run this ON the server after git pull
# Usage: ./server_deploy.sh [--all|--backend|--frontend]
# ============================================

PROJECT_DIR="/root/ds_project_new"
BACKEND_DIR="${PROJECT_DIR}/ds_backend-main"
FRONTEND_DIR="${PROJECT_DIR}/qmeter-ds-ds-frontend-29f0c1bf6d59"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

DEPLOY_BACKEND=false
DEPLOY_FRONTEND=false

# Parse arguments
case "${1:-}" in
    --all)      DEPLOY_BACKEND=true; DEPLOY_FRONTEND=true ;;
    --backend)  DEPLOY_BACKEND=true ;;
    --frontend) DEPLOY_FRONTEND=true ;;
    *)
        echo "Usage: $0 [--all|--backend|--frontend]"
        echo "  --all       Deploy both backend and frontend"
        echo "  --backend   Deploy backend only"
        echo "  --frontend  Deploy frontend only"
        exit 1
        ;;
esac

# Pull latest code
log "Pulling latest code..."
cd "$PROJECT_DIR"
git pull origin main

# ============================================
# Backend
# ============================================
if [ "$DEPLOY_BACKEND" = true ]; then
    log "Deploying backend..."
    cd "$BACKEND_DIR"

    # Check .env exists
    if [ ! -f .env ]; then
        err "Backend .env file missing! Create it first."
    fi

    # Build and restart
    log "Building backend containers..."
    docker compose up -d --build

    # Wait for postgres to be healthy
    log "Waiting for postgres..."
    sleep 5

    # Run migrations
    log "Running migrations..."
    docker exec dsqmeter-new python manage.py migrate --noinput

    # Collect static files
    log "Collecting static files..."
    docker exec dsqmeter-new python manage.py collectstatic --noinput

    log "Backend deployed successfully!"
fi

# ============================================
# Frontend
# ============================================
if [ "$DEPLOY_FRONTEND" = true ]; then
    log "Deploying frontend..."
    cd "$FRONTEND_DIR"

    # Build and restart (multi-stage Docker build)
    log "Building frontend (this may take a few minutes)..."
    docker compose up -d --build

    log "Frontend deployed successfully!"
fi

# Show running containers
echo ""
log "Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "dsqmeter-new|ds-front-new|postgres-new" || true

echo ""
log "Deploy complete!"
