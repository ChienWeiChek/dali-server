#!/usr/bin/env bash
# Deploy / update script for DALI server (Mac / Linux)
#
# Usage:
#   ./deploy.sh              # deploy latest release
#   ./deploy.sh --tag v1.0.0 # deploy a specific release
#
set -euo pipefail

OWNER="ChienWeiChek"
REPO="dali-server"
TAG="latest"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log_step() { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
log_info()  { echo -e "${CYAN}[INFO]${NC}   $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}   $*"; }
log_fatal() { echo -e "${RED}[ERROR]${NC}  $*"; exit 1; }

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --tag) TAG="$2"; shift 2 ;;
        *)     log_fatal "Unknown argument: $1" ;;
    esac
done

# ------------------------------------------------------------------
# 1. Dependency checks
# ------------------------------------------------------------------
command -v curl   &>/dev/null || log_fatal "curl is not installed."
command -v docker &>/dev/null || log_fatal "Docker is not installed."

if docker compose version &>/dev/null 2>&1; then
    DC="docker compose"
elif command -v docker-compose &>/dev/null; then
    DC="docker-compose"
else
    log_fatal "Neither 'docker compose' nor 'docker-compose' found."
fi

# unzip or python3 fallback for extraction
if command -v unzip &>/dev/null; then
    UNZIP_CMD="unzip"
elif command -v python3 &>/dev/null; then
    UNZIP_CMD="python3"
else
    log_fatal "Install unzip (or python3) to extract the release archive."
fi

# ------------------------------------------------------------------
# 2. Resolve release and download zip
# ------------------------------------------------------------------
log_step "Fetching release info from GitHub..."

if [ "$TAG" = "latest" ]; then
    API_URL="https://api.github.com/repos/$OWNER/$REPO/releases/latest"
else
    API_URL="https://api.github.com/repos/$OWNER/$REPO/releases/tags/$TAG"
fi

RELEASE_JSON=$(curl -fsSL -H "User-Agent: dali-deploy" "$API_URL") \
    || log_fatal "GitHub API request failed."

TAG_NAME=$(echo "$RELEASE_JSON" \
    | grep '"tag_name"' | head -1 \
    | sed 's/.*"tag_name" *: *"\([^"]*\)".*/\1/')

[ -z "$TAG_NAME" ] && log_fatal "Could not parse tag_name from GitHub API response."

ZIP_URL="https://github.com/$OWNER/$REPO/archive/refs/tags/$TAG_NAME.zip"

log_step "Downloading release $TAG_NAME ..."

TMP_ZIP=$(mktemp /tmp/dali-deploy-XXXXXX.zip)
TMP_DIR=$(mktemp -d /tmp/dali-deploy-XXXXXX)

# Always clean up temp files on exit
cleanup_tmp() { rm -rf "$TMP_ZIP" "$TMP_DIR"; }
trap cleanup_tmp EXIT

curl -fsSL -o "$TMP_ZIP" "$ZIP_URL" || log_fatal "Download failed."

log_info "Extracting archive..."
if [ "$UNZIP_CMD" = "unzip" ]; then
    unzip -q "$TMP_ZIP" -d "$TMP_DIR"
else
    python3 -c "
import zipfile, sys
with zipfile.ZipFile(sys.argv[1]) as z:
    z.extractall(sys.argv[2])
" "$TMP_ZIP" "$TMP_DIR"
fi
rm -f "$TMP_ZIP"

# GitHub zips always contain one top-level folder, e.g. dali-server-1.0.0
SRC_DIR=$(find "$TMP_DIR" -maxdepth 1 -mindepth 1 -type d | head -1)
[ -z "$SRC_DIR" ] && log_fatal "Could not find extracted source directory."
log_info "Source ready: $SRC_DIR"

# ------------------------------------------------------------------
# 3. Merge release files into SCRIPT_DIR
#    Preserve existing config/ and .env so user edits survive updates.
# ------------------------------------------------------------------
log_step "Installing release files..."

for item in "$SRC_DIR"/.[!.]* "$SRC_DIR"/*; do
    [ -e "$item" ] || continue
    name="$(basename "$item")"
    dest="$SCRIPT_DIR/$name"

    if [ "$name" = "config" ] && [ -d "$dest" ]; then
        log_info "Skipping config/ -- keeping existing"
        continue
    fi
    if [ "$name" = ".env" ] && [ -f "$dest" ]; then
        log_info "Skipping .env -- keeping existing"
        continue
    fi

    cp -rf "$item" "$dest"
done

# ------------------------------------------------------------------
# 4. Ensure .env exists
# ------------------------------------------------------------------
ENV_FILE="$SCRIPT_DIR/.env"
ENV_EXAMPLE="$SCRIPT_DIR/.env.example"

if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
        log_warn ".env not found -- copying .env.example. Edit the file then re-run."
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        echo ""
        echo "  --> Edit: $ENV_FILE"
        echo ""
        exit 1
    else
        log_fatal ".env not found. Create it and re-run."
    fi
fi

# ------------------------------------------------------------------
# 5. Build and start containers
# ------------------------------------------------------------------
log_step "Building Docker images and starting containers..."
(cd "$SCRIPT_DIR/infrastructure" && $DC up --build -d)

# ------------------------------------------------------------------
# 6. Wait for all services to reach running state
# ------------------------------------------------------------------
log_step "Waiting for services to start (up to 120s)..."
MAX_WAIT=120
ELAPSED=0
ALL_UP=false

while [ "$ELAPSED" -lt "$MAX_WAIT" ]; do
    TOTAL=$(cd "$SCRIPT_DIR/infrastructure" && $DC ps --services 2>/dev/null | wc -l | tr -d ' ')
    RUNNING=$(cd "$SCRIPT_DIR/infrastructure" && $DC ps --services --filter "status=running" 2>/dev/null | wc -l | tr -d ' ')

    if [ "$TOTAL" -gt 0 ] && [ "$RUNNING" -ge "$TOTAL" ]; then
        ALL_UP=true
        break
    fi

    log_info "$RUNNING / $TOTAL running ($ELAPSED s elapsed)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ "$ALL_UP" = true ]; then
    log_step "All services are running."
else
    log_warn "Timed out -- some containers may still be starting."
fi
(cd "$SCRIPT_DIR/infrastructure" && $DC ps)

# ------------------------------------------------------------------
# 7. Remove source code; keep only runtime files
# ------------------------------------------------------------------
log_step "Removing source code..."

KEEP=(".env" ".env.example" "config" "infrastructure" "deploy.sh" "deploy.ps1")

for item in "$SCRIPT_DIR"/.[!.]* "$SCRIPT_DIR"/*; do
    [ -e "$item" ] || continue
    name="$(basename "$item")"
    skip=false
    for k in "${KEEP[@]}"; do
        [ "$name" = "$k" ] && { skip=true; break; }
    done
    if [ "$skip" = false ]; then
        rm -rf "$item"
        log_info "Removed: $name"
    fi
done

# ------------------------------------------------------------------
# Done
# ------------------------------------------------------------------
log_step "Deployment complete! ($TAG_NAME)"
echo ""
echo "  Dashboard  : http://localhost"
echo "  API        : http://localhost/api"
echo "  InfluxDB   : http://localhost:8086"
echo "  MQTT       : mqtt://localhost:1883"
echo ""
echo "  To update  : ./deploy.sh"
echo "  To stop    : cd infrastructure && $DC down"
echo "  To view    : cd infrastructure && $DC ps"
echo ""
