#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory (to handle being called from anywhere)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Usage
usage() {
  echo "Usage: $0 <version>"
  echo ""
  echo "Examples:"
  echo "  $0 1.0.5          # Stable release"
  echo "  $0 1.0.5-beta.1   # Prerelease"
  echo "  $0 2.0.0-rc.1     # Release candidate"
  exit 1
}

# Validate version argument
if [ $# -ne 1 ]; then
  echo -e "${RED}Error: Version argument required${NC}"
  usage
fi

NEW_VERSION="$1"

# Basic semver validation (supports prereleases)
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo -e "${RED}Error: Invalid version format${NC}"
  echo "Version must follow semver: X.Y.Z or X.Y.Z-prerelease"
  exit 1
fi

echo -e "${GREEN}Bumping version to ${NEW_VERSION}${NC}"
echo ""

# Change to repo root
cd "$ROOT_DIR"

# 1. Validate we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}Error: Not in a git repository${NC}"
  exit 1
fi

# 2. Validate clean working directory
if [[ -n $(git status --porcelain) ]]; then
  echo -e "${RED}Error: Working directory is not clean${NC}"
  echo "Please commit or stash your changes first:"
  git status --short
  exit 1
fi

# 3. Validate current branch is master
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "master" ]]; then
  echo -e "${YELLOW}Warning: Not on master branch (current: ${CURRENT_BRANCH})${NC}"
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted"
    exit 1
  fi
fi

# 4. Update package.json files
echo -e "${GREEN}Updating package.json files...${NC}"

# Root package.json
jq --arg version "$NEW_VERSION" '.version = $version' package.json > package.json.tmp && mv package.json.tmp package.json
echo "  ✓ package.json → $NEW_VERSION"

# API package.json
jq --arg version "$NEW_VERSION" '.version = $version' services/api/package.json > services/api/package.json.tmp && mv services/api/package.json.tmp services/api/package.json
echo "  ✓ services/api/package.json → $NEW_VERSION"

# Dashboard package.json
jq --arg version "$NEW_VERSION" '.version = $version' apps/dashboard/package.json > apps/dashboard/package.json.tmp && mv apps/dashboard/package.json.tmp apps/dashboard/package.json
echo "  ✓ apps/dashboard/package.json → $NEW_VERSION"

echo ""

# 5. Commit changes
echo -e "${GREEN}Creating commit...${NC}"
git add package.json services/api/package.json apps/dashboard/package.json
git commit -m "chore: bump version to v${NEW_VERSION}"
echo "  ✓ Committed version bump"
echo ""

# 6. Create git tag
echo -e "${GREEN}Creating git tag...${NC}"
git tag "v${NEW_VERSION}"
echo "  ✓ Created tag v${NEW_VERSION}"
echo ""

# 7. Success message with push instructions
echo -e "${GREEN}✓ Version bump complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the changes:"
echo "     ${YELLOW}git show${NC}"
echo ""
echo "  2. Push the commit and tag:"
echo "     ${YELLOW}git push && git push --tags${NC}"
echo ""
echo "  3. GitHub will automatically create a release for tag v${NEW_VERSION}"
