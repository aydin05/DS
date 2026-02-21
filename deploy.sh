#!/bin/bash
set -e

# ============================================
# Deploy Script for DS Backend & Frontend
# Server: 116.203.187.99
# ============================================

SERVER="116.203.187.99"
SSH_USER="root"
SSH_TARGET="${SSH_USER}@${SERVER}"
SSH_OPTS="-o ServerAliveInterval=30 -o ServerAliveCountMax=10"

# Local paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR}/qmeter-ds-ds-frontend-29f0c1bf6d59"
BACKEND_DIR="${SCRIPT_DIR}/ds_backend-main"
TIZEN_APP_DIR="${SCRIPT_DIR}/Tizen/DigitalSignatureApp"

# Remote paths
REMOTE_FRONTEND="/root/ds_frontend"
REMOTE_BACKEND="/root/ds_backend"
REMOTE_TIZEN_APP="/var/www/tizen-app"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ============================================
# Parse arguments
# ============================================
DEPLOY_FRONTEND=false
DEPLOY_BACKEND=false
DEPLOY_TIZEN=false
SKIP_BUILD=false

usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --frontend    Deploy frontend only"
    echo "  --backend     Deploy backend only"
    echo "  --tizen-app   Deploy Tizen URL Launcher app (static site)"
    echo "  --all         Deploy frontend + backend + tizen-app"
    echo "  --skip-build  Skip frontend npm build (use existing build/ folder)"
    echo "  -h, --help    Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 --all              # Build frontend locally + deploy both"
    echo "  $0 --frontend         # Build + deploy frontend only"
    echo "  $0 --backend          # Deploy backend only"
    echo "  $0 --frontend --skip-build  # Deploy frontend without rebuilding"
}

if [ $# -eq 0 ]; then
    DEPLOY_FRONTEND=true
    DEPLOY_BACKEND=true
    DEPLOY_TIZEN=true
fi

while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend)  DEPLOY_FRONTEND=true; shift ;;
        --backend)   DEPLOY_BACKEND=true; shift ;;
        --tizen-app) DEPLOY_TIZEN=true; shift ;;
        --all)       DEPLOY_FRONTEND=true; DEPLOY_BACKEND=true; DEPLOY_TIZEN=true; shift ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        -h|--help)   usage; exit 0 ;;
        *)           err "Unknown option: $1. Use --help for usage." ;;
    esac
done

# ============================================
# Verify SSH connectivity
# ============================================
log "Checking SSH connectivity to ${SERVER}..."
ssh -o ConnectTimeout=5 -o ServerAliveInterval=30 ${SSH_TARGET} "echo ok" > /dev/null 2>&1 || err "Cannot connect to ${SERVER}. Check SSH access."
log "SSH connection OK"

# ============================================
# FRONTEND DEPLOYMENT
# ============================================
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo ""
    echo "========================================"
    echo "  FRONTEND DEPLOYMENT"
    echo "========================================"

    # Verify frontend directory exists
    [ -d "$FRONTEND_DIR" ] || err "Frontend directory not found: ${FRONTEND_DIR}"

    # Step 1: Build frontend locally (server has limited RAM)
    if [ "$SKIP_BUILD" = false ]; then
        log "Building CKEditor custom build..."
        if [ -d "${FRONTEND_DIR}/custom-ckeditor5" ]; then
            cd "${FRONTEND_DIR}/custom-ckeditor5"
            if [ ! -d "node_modules" ]; then
                npm install 2>&1 | tail -3
            fi
            npm run build 2>&1 | tail -3
            # Copy built ckeditor to where the app expects it
            mkdir -p "${FRONTEND_DIR}/src/ckeditor5-custom-build/build/"
            cp -f build/ckeditor.js "${FRONTEND_DIR}/src/ckeditor5-custom-build/build/ckeditor.js" 2>/dev/null || true
            log "CKEditor build complete"
        fi

        log "Installing frontend dependencies..."
        cd "${FRONTEND_DIR}"
        if [ ! -d "node_modules" ]; then
            npm install 2>&1 | tail -5
            log "npm install complete"
        else
            log "node_modules exists, skipping npm install"
        fi

        # Remove custom build node_modules to prevent duplicate @ckeditor modules
        # npm install re-creates it via file: symlink, but the pre-built ckeditor.js
        # is self-contained — source packages would cause ckeditor-duplicated-modules error
        rm -rf "${FRONTEND_DIR}/custom-ckeditor5/node_modules"
        log "Cleaned custom-ckeditor5/node_modules to avoid CKEditor duplicates"

        log "Building frontend (this may take a few minutes)..."
        cd "${FRONTEND_DIR}"
        npm run build 2>&1 | tail -10
        log "Frontend build complete"
    else
        warn "Skipping build (--skip-build), using existing build/ folder"
    fi

    # Verify build output exists
    [ -d "${FRONTEND_DIR}/build" ] || err "Build directory not found. Run without --skip-build."
    [ -f "${FRONTEND_DIR}/build/index.html" ] || err "build/index.html not found. Build may have failed."
    log "Build directory verified ($(find ${FRONTEND_DIR}/build -type f | wc -l | tr -d ' ') files)"

    # Step 2: Sync build files to server
    log "Uploading build files to server..."
    rsync -az --delete \
        "${FRONTEND_DIR}/build/" \
        "${SSH_TARGET}:${REMOTE_FRONTEND}/build/"
    log "Build files uploaded"

    # Also sync server.js, docker-compose.yml, Dockerfile.serve in case they changed
    rsync -az \
        "${FRONTEND_DIR}/server.js" \
        "${FRONTEND_DIR}/docker-compose.yml" \
        "${FRONTEND_DIR}/Dockerfile.serve" \
        "${FRONTEND_DIR}/.env" \
        "${SSH_TARGET}:${REMOTE_FRONTEND}/"

    # Step 3: Rebuild and restart frontend container
    # Ensure docker-compose.yml uses Dockerfile.serve (lightweight, pre-built)
    ssh ${SSH_TARGET} "grep -q 'Dockerfile.serve' ${REMOTE_FRONTEND}/docker-compose.yml || sed -i 's|context: .|context: .\n      dockerfile: Dockerfile.serve|' ${REMOTE_FRONTEND}/docker-compose.yml"

    log "Rebuilding and restarting frontend container..."
    ssh ${SSH_OPTS} ${SSH_TARGET} "cd ${REMOTE_FRONTEND} && docker compose up -d --build 2>&1"
    log "Frontend container restarted"

    log "Restarting nginx-proxy to pick up new container IP..."
    ssh ${SSH_TARGET} "docker restart nginx-proxy"
    log "nginx-proxy restarted"
fi

# ============================================
# BACKEND DEPLOYMENT
# ============================================
if [ "$DEPLOY_BACKEND" = true ]; then
    echo ""
    echo "========================================"
    echo "  BACKEND DEPLOYMENT"
    echo "========================================"

    # Verify backend directory exists
    [ -d "$BACKEND_DIR" ] || err "Backend directory not found: ${BACKEND_DIR}"

    # Step 1: Sync backend files to server (exclude unnecessary files)
    log "Uploading backend files to server..."
    rsync -az --delete \
        --exclude '.git' \
        --exclude '__pycache__' \
        --exclude '*.pyc' \
        --exclude '.env' \
        --exclude '_development' \
        --exclude 'media/' \
        --exclude 'logs/' \
        --exclude 'venv/' \
        --exclude '.venv/' \
        "${BACKEND_DIR}/" \
        "${SSH_TARGET}:${REMOTE_BACKEND}/"
    log "Backend files uploaded"

    # Step 2: Rebuild and restart backend container
    log "Rebuilding backend container on server..."
    ssh ${SSH_OPTS} ${SSH_TARGET} "cd ${REMOTE_BACKEND} && docker compose build 2>&1"
    log "Backend image rebuilt"

    log "Restarting backend web container (preserving database)..."
    ssh ${SSH_TARGET} "cd ${REMOTE_BACKEND} && docker compose up -d --force-recreate --no-deps web 2>&1"
    log "Backend container restarted"

    # Step 3: Run migrations
    log "Running database migrations..."
    ssh ${SSH_TARGET} "docker exec dsqmeter python manage.py migrate --noinput 2>&1 | tail -5"
    log "Migrations complete"

    # Step 4: Collect static files
    log "Collecting static files..."
    ssh ${SSH_TARGET} "docker exec dsqmeter python manage.py collectstatic --noinput 2>&1 | tail -3"
    log "Static files collected"
fi

# ============================================
# TIZEN URL LAUNCHER APP DEPLOYMENT
# ============================================
if [ "$DEPLOY_TIZEN" = true ]; then
    echo ""
    echo "========================================"
    echo "  TIZEN URL LAUNCHER APP DEPLOYMENT"
    echo "========================================"

    [ -d "$TIZEN_APP_DIR" ] || err "Tizen app directory not found: ${TIZEN_APP_DIR}"

    # Find the .wgt file
    WGT_FILE=$(find "${TIZEN_APP_DIR}" -maxdepth 1 -name "*.wgt" -type f | head -1)
    if [ -z "$WGT_FILE" ]; then
        err "No .wgt file found in ${TIZEN_APP_DIR}. Build it first in Tizen Studio: Right-click project > Build Signed Package"
    fi
    WGT_BASENAME=$(basename "$WGT_FILE")
    WGT_SIZE=$(wc -c < "$WGT_FILE" | tr -d ' ')
    WGT_NAME="${WGT_BASENAME%.wgt}"
    log "Found .wgt package: ${WGT_BASENAME} (${WGT_SIZE} bytes)"

    # Generate sssp_config.xml
    SSSP_DIR="${SCRIPT_DIR}/Tizen/sssp"
    mkdir -p "${SSSP_DIR}"
    cat > "${SSSP_DIR}/sssp_config.xml" << SSSP_EOF
<widget>
    <ver>1.0</ver>
    <size>${WGT_SIZE}</size>
    <widgetname>${WGT_NAME}</widgetname>
</widget>
SSSP_EOF
    log "Generated sssp_config.xml (widgetname=${WGT_NAME}, size=${WGT_SIZE})"

    # Create placeholder index.html if it doesn't exist
    if [ ! -f "${SSSP_DIR}/index.html" ]; then
        echo "Digital Signage App" > "${SSSP_DIR}/index.html"
    fi

    # Create remote directory
    ssh ${SSH_TARGET} "mkdir -p ${REMOTE_TIZEN_APP}"

    # Upload .wgt, sssp_config.xml, and index.html
    log "Uploading SSSP files to server..."
    rsync -az "${WGT_FILE}" "${SSH_TARGET}:${REMOTE_TIZEN_APP}/${WGT_BASENAME}"
    rsync -az "${SSSP_DIR}/sssp_config.xml" "${SSH_TARGET}:${REMOTE_TIZEN_APP}/sssp_config.xml"
    rsync -az "${SSSP_DIR}/index.html" "${SSH_TARGET}:${REMOTE_TIZEN_APP}/index.html"
    log "SSSP files uploaded"

    # Ensure nginx serves /app/ over HTTP (Samsung TVs need HTTP for SSSP)
    log "Checking nginx config for /app/ location..."
    if ssh ${SSH_TARGET} "grep -q 'location /app/' /root/nginx.conf"; then
        log "/app/ location already exists in nginx config"
    else
        log "Adding /app/ location to nginx config..."
        # Add to both HTTP and HTTPS server blocks
        ssh ${SSH_TARGET} "sed -i '/return 301 https/i\\
    location /app/ {\\
        alias /var/www/tizen-app/;\\
        index index.html;\\
        add_header Access-Control-Allow-Origin *;\\
    }\\
' /root/nginx.conf"
        log "nginx config updated"
    fi

    # Ensure tizen-app volume is mounted in nginx-proxy
    log "Checking if tizen-app volume is mounted in nginx-proxy..."
    if ssh ${SSH_TARGET} "docker inspect nginx-proxy --format '{{json .Mounts}}' | grep -q tizen-app"; then
        log "Volume already mounted, reloading nginx..."
        ssh ${SSH_TARGET} "docker exec nginx-proxy nginx -s reload 2>&1"
    else
        log "Adding /var/www/tizen-app volume mount to nginx-proxy..."
        ssh ${SSH_TARGET} "docker stop nginx-proxy && docker rm nginx-proxy && \
            docker run -d --name nginx-proxy \
            --network nginx-proxy \
            -p 80:80 -p 443:443 \
            -v /root/nginx.conf:/etc/nginx/conf.d/default.conf \
            -v /etc/letsencrypt:/etc/letsencrypt:ro \
            -v /var/www/tizen-app:/var/www/tizen-app:ro \
            --restart unless-stopped \
            nginx:latest 2>&1"
        log "nginx-proxy recreated with tizen-app volume"
    fi

    log "Tizen SSSP app deployed at: http://aydin.technolink.az/app/"
    log "Files on server:"
    ssh ${SSH_TARGET} "ls -la ${REMOTE_TIZEN_APP}/"
fi

# ============================================
# Verify deployment
# ============================================
echo ""
echo "========================================"
echo "  VERIFICATION"
echo "========================================"

log "Checking running containers..."
ssh ${SSH_TARGET} "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E 'ds|nginx|postgres'"

echo ""
log "Checking frontend health..."
HTTP_STATUS=$(ssh ${SSH_TARGET} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3333/" 2>/dev/null)
if [ "$HTTP_STATUS" = "200" ]; then
    log "Frontend responding OK (HTTP ${HTTP_STATUS})"
else
    warn "Frontend returned HTTP ${HTTP_STATUS}"
fi

log "Checking backend API health..."
API_STATUS=$(ssh ${SSH_TARGET} "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api/v1/accounts/login/" 2>/dev/null)
if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "301" ] || [ "$API_STATUS" = "400" ] || [ "$API_STATUS" = "403" ] || [ "$API_STATUS" = "405" ]; then
    log "Backend API responding OK (HTTP ${API_STATUS})"
else
    warn "Backend API returned HTTP ${API_STATUS}"
fi

echo ""
log "Deployment complete! Site: http://${SERVER}/"
