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
TIZEN_APP_DIR="${PROJECT_DIR}/Tizen/SimpleUrlLauncher"
SSDP_DIR="${PROJECT_DIR}/Tizen/sssp"
REMOTE_TIZEN_APP="/var/www/tizen-app-new"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

DEPLOY_BACKEND=false
DEPLOY_FRONTEND=false
DEPLOY_TIZEN=false

# Parse arguments
case "${1:-}" in
    --all)      DEPLOY_BACKEND=true; DEPLOY_FRONTEND=true; DEPLOY_TIZEN=true ;;
    --backend)  DEPLOY_BACKEND=true ;;
    --frontend) DEPLOY_FRONTEND=true ;;
    --tizen)    DEPLOY_TIZEN=true ;;
    *)
        echo "Usage: $0 [--all|--backend|--frontend|--tizen]"
        echo "  --all       Deploy backend, frontend, and tizen"
        echo "  --backend   Deploy backend only"
        echo "  --frontend  Deploy frontend only"
        echo "  --tizen     Deploy Tizen SSSP app only"
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

# ============================================
# Tizen SSSP App
# ============================================
if [ "$DEPLOY_TIZEN" = true ]; then
    log "Deploying Tizen SSSP app..."

    # Find the .wgt file
    WGT_FILE=$(find "${TIZEN_APP_DIR}" -maxdepth 1 -name "*.wgt" -type f | head -1)
    if [ -z "$WGT_FILE" ]; then
        err "No .wgt file found in ${TIZEN_APP_DIR}. Build it first in Tizen Studio and push to git."
    fi
    WGT_BASENAME=$(basename "$WGT_FILE")
    WGT_SIZE=$(wc -c < "$WGT_FILE" | tr -d ' ')
    WGT_NAME="${WGT_BASENAME%.wgt}"
    log "Found .wgt package: ${WGT_BASENAME} (${WGT_SIZE} bytes)"

    # Generate sssp_config.xml
    SSSP_VER="$(date +%Y%m%d.%H%M%S)"
    mkdir -p "${SSDP_DIR}"
    cat > "${SSDP_DIR}/sssp_config.xml" << SSSP_EOF
<widget>
    <ver>${SSSP_VER}</ver>
    <size>${WGT_SIZE}</size>
    <widgetname>${WGT_NAME}</widgetname>
</widget>
SSDP_EOF
    log "Generated sssp_config.xml (ver=${SSSP_VER})"

    # Copy files to serve directory
    mkdir -p "${REMOTE_TIZEN_APP}"
    cp "${WGT_FILE}" "${REMOTE_TIZEN_APP}/${WGT_BASENAME}"
    cp "${SSDP_DIR}/sssp_config.xml" "${REMOTE_TIZEN_APP}/sssp_config.xml"
    cp "${SSDP_DIR}/index.html" "${REMOTE_TIZEN_APP}/index.html"
    log "SSSP files copied to ${REMOTE_TIZEN_APP}"

    # Check nginx config for /newds-app/ location
    if grep -q 'location /newds-app/' /root/nginx.conf 2>/dev/null; then
        log "/newds-app/ location already in nginx config"
        docker exec nginx-proxy nginx -s reload 2>/dev/null || true
    else
        warn "Add this to your nginx config and reload:"
        echo "    location /newds-app/ {"
        echo "        alias /var/www/tizen-app-new/;"
        echo "        index index.html;"
        echo "        add_header Access-Control-Allow-Origin *;"
        echo "    }"
    fi

    log "Tizen SSSP app deployed! Files:"
    ls -la "${REMOTE_TIZEN_APP}/"
fi

# Show running containers
echo ""
log "Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "dsqmeter-new|ds-front-new|postgres-new" || true

echo ""
log "Deploy complete!"
