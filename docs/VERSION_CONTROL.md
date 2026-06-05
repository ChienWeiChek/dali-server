# Version Control Guide

This project uses git tags for version management, with synchronized versions across API and dashboard.

## Quick Start

To create a new release:

```bash
# Bump version and create tag
./scripts/bump-version.sh 1.0.5

# Review the changes
git show

# Push to trigger GitHub release
git push && git push --tags
```

## Version Strategy

- **Synchronized versions**: API and dashboard share the same version number
- **Semver format**: `X.Y.Z` or `X.Y.Z-prerelease`
- **Git tags**: Version tags are prefixed with `v` (e.g., `v1.0.5`)
- **GitHub releases**: Automatically created when tags are pushed

## Version Bump Script

The `scripts/bump-version.sh` script:

1. ✅ Validates clean working directory (no uncommitted changes)
2. ✅ Validates you're on the `master` branch
3. ✅ Updates all 3 package.json files:
   - Root: `package.json`
   - API: `services/api/package.json`
   - Dashboard: `apps/dashboard/package.json`
4. ✅ Creates a commit: `chore: bump version to vX.Y.Z`
5. ✅ Creates a git tag: `vX.Y.Z`
6. ✅ Prints push instructions (does NOT auto-push)

### Examples

**Stable release:**
```bash
./scripts/bump-version.sh 1.0.5
```

**Prerelease versions:**
```bash
./scripts/bump-version.sh 1.0.5-beta.1    # Beta
./scripts/bump-version.sh 1.0.5-rc.1      # Release candidate
./scripts/bump-version.sh 2.0.0-alpha.1   # Alpha
```

## Pre-push Hook

A git hook validates version consistency before allowing tag pushes.

If you manually create a tag without updating package.json files, the push will be rejected:

```bash
# ❌ This will fail
git tag v1.0.6
git push --tags
# Error: package.json version (1.0.5) does not match tag (1.0.6)
# Hint: Use ./scripts/bump-version.sh 1.0.6 to update versions and create tag
```

## Version Display

### API
- Version exposed via `/api/health` endpoint
- Reads from `services/api/package.json` at runtime
- Example response:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-06-05T12:00:00Z",
    "version": "1.0.5",
    "services": { ... }
  }
  ```

### Dashboard
- **Footer**: Shows dashboard version (build-time injection)
- **/health page**: Shows both dashboard and API versions
- **Version mismatch detection**: Warns if dashboard/API versions don't match (cache issue)

## Troubleshooting

### Dashboard showing old version after deployment

**Symptom**: Dashboard footer shows v1.0.4 but API shows v1.0.5

**Cause**: Browser cached old dashboard assets

**Fix**: Go to `/health` page and click "Refresh Now" button, or hard-refresh (Ctrl+Shift+R / Cmd+Shift+R)

### Pre-push hook rejects tag push

**Symptom**: `git push --tags` fails with version mismatch error

**Cause**: package.json versions don't match the tag being pushed

**Fix**: Always use the bump script instead of manually creating tags:
```bash
./scripts/bump-version.sh 1.0.6  # Use this instead of git tag
```

### Script fails with "Working directory is not clean"

**Symptom**: Bump script aborts with uncommitted changes error

**Fix**: Commit or stash your changes first:
```bash
git status                        # See what's uncommitted
git add . && git commit -m "..."  # Commit changes
# OR
git stash                         # Stash changes temporarily
./scripts/bump-version.sh 1.0.5
git stash pop                     # Restore stashed changes
```

## Release Workflow

1. **Make changes** on feature branch
2. **Merge to master** via pull request
3. **Bump version** using script:
   ```bash
   ./scripts/bump-version.sh 1.0.5
   ```
4. **Review commit**:
   ```bash
   git show  # Verify package.json changes
   ```
5. **Push**:
   ```bash
   git push && git push --tags
   ```
6. **GitHub creates release** automatically (`.github/workflows/release.yml`)
7. **Deploy** by pulling and running `npm run docker:up` on server

## Dependencies

The bump script requires:
- `jq` (JSON processor) — [Install instructions](https://jqlang.github.io/jq/download/)
- Git repository
- Bash shell (Git Bash on Windows)
