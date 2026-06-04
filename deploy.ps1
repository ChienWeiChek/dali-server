<#
.SYNOPSIS
    Deploy / update script for DALI server (Windows, PowerShell 5.1+)
.DESCRIPTION
    Downloads the latest GitHub release, builds Docker images, starts all
    containers, then removes source code while keeping config/, .env, and
    infrastructure/ (which holds docker-compose.yml and mounted configs).
.PARAMETER Tag
    Release tag to deploy, e.g. "v1.0.0".  Defaults to "latest".
.EXAMPLE
    .\deploy.ps1
.EXAMPLE
    .\deploy.ps1 -Tag v1.0.0
#>
param(
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"
$Owner     = "ChienWeiChek"
$Repo      = "dali-server"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Log-Step  { param($m) Write-Host "[DEPLOY] $m" -ForegroundColor Green  }
function Log-Info  { param($m) Write-Host "[INFO]   $m" -ForegroundColor Cyan   }
function Log-Warn  { param($m) Write-Host "[WARN]   $m" -ForegroundColor Yellow }
function Log-Fatal { param($m) Write-Host "[ERROR]  $m" -ForegroundColor Red; exit 1 }

# ------------------------------------------------------------------
# 1. Dependency checks
# ------------------------------------------------------------------
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Log-Fatal "Docker is not installed."
}

$DC = $null
try {
    $null = & docker compose version 2>$null
    if ($LASTEXITCODE -eq 0) { $DC = "docker compose" }
} catch {}

if (-not $DC) {
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        $DC = "docker-compose"
    } else {
        Log-Fatal "Neither 'docker compose' nor 'docker-compose' found."
    }
}

# ------------------------------------------------------------------
# 2. Resolve release and download zip
# ------------------------------------------------------------------
Log-Step "Fetching release info from GitHub..."

if ($Tag -eq "latest") {
    $apiUrl = "https://api.github.com/repos/$Owner/$Repo/releases/latest"
} else {
    $apiUrl = "https://api.github.com/repos/$Owner/$Repo/releases/tags/$Tag"
}

try {
    $release = Invoke-RestMethod -Uri $apiUrl -Headers @{ "User-Agent" = "dali-deploy" }
} catch {
    Log-Fatal "GitHub API request failed: $_"
}

$tagName = $release.tag_name
$zipUrl  = "https://github.com/$Owner/$Repo/archive/refs/tags/$tagName.zip"

Log-Step "Downloading release $tagName ..."

$tmpZip = Join-Path $env:TEMP ("dali-" + $tagName + ".zip")
$tmpDir = Join-Path $env:TEMP ("dali-" + $tagName)

if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
if (Test-Path $tmpZip) { Remove-Item $tmpZip -Force }

try {
    Invoke-WebRequest -Uri $zipUrl -OutFile $tmpZip -UseBasicParsing
} catch {
    Log-Fatal "Download failed: $_"
}

Log-Info "Extracting archive..."
Expand-Archive -Path $tmpZip -DestinationPath $tmpDir -Force
Remove-Item $tmpZip -Force

# GitHub zips always contain one top-level folder, e.g. dali-server-1.0.0
$srcDir = (Get-ChildItem $tmpDir -Directory | Select-Object -First 1).FullName
if (-not $srcDir) { Log-Fatal "Extracted directory not found." }
Log-Info "Source ready: $srcDir"

# ------------------------------------------------------------------
# 3. Merge release files into ScriptDir
#    Preserve existing config/ and .env so user edits survive updates.
# ------------------------------------------------------------------
Log-Step "Installing release files..."

Get-ChildItem $srcDir -Force | ForEach-Object {
    $name = $_.Name
    $dest = Join-Path $ScriptDir $name

    if ($name -eq "config" -and (Test-Path $dest)) {
        Log-Info "Skipping config/ -- keeping existing"
        return
    }
    if ($name -eq ".env" -and (Test-Path $dest)) {
        Log-Info "Skipping .env -- keeping existing"
        return
    }

    if ($_.PSIsContainer) {
        Copy-Item $_.FullName $dest -Recurse -Force
    } else {
        Copy-Item $_.FullName $dest -Force
    }
}

Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue

# ------------------------------------------------------------------
# 4. Ensure .env exists
# ------------------------------------------------------------------
$envFile    = Join-Path $ScriptDir ".env"
$envExample = Join-Path $ScriptDir ".env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Log-Warn ".env not found -- copying .env.example. Edit the file then re-run."
        Copy-Item $envExample $envFile
        Write-Host ""
        Write-Host "  --> Edit: $envFile" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    } else {
        Log-Fatal ".env not found. Create it and re-run."
    }
}

# ------------------------------------------------------------------
# 5. Build and start containers
# ------------------------------------------------------------------
Log-Step "Building Docker images and starting containers..."

Push-Location (Join-Path $ScriptDir "infrastructure")
try {
    Invoke-Expression ("$DC up --build -d")
    if ($LASTEXITCODE -ne 0) { Log-Fatal "docker compose exited with code $LASTEXITCODE." }
} finally {
    Pop-Location
}

# ------------------------------------------------------------------
# 6. Wait for all services to reach running state
# ------------------------------------------------------------------
Log-Step "Waiting for services to start (up to 120s)..."

$maxWait = 120
$elapsed = 0
$allUp   = $false

Push-Location (Join-Path $ScriptDir "infrastructure")
try {
    while ($elapsed -lt $maxWait) {
        $all = @(Invoke-Expression ("$DC ps --services") |
                 Where-Object { $_.Trim() -ne "" })
        $up  = @(Invoke-Expression ("$DC ps --services --filter status=running") |
                 Where-Object { $_.Trim() -ne "" })

        if ($all.Count -gt 0 -and $up.Count -ge $all.Count) {
            $allUp = $true
            break
        }

        Log-Info "$($up.Count) / $($all.Count) running ($elapsed s elapsed)"
        Start-Sleep 5
        $elapsed += 5
    }

    if ($allUp) {
        Log-Step "All services are running."
    } else {
        Log-Warn "Timed out -- some containers may still be starting."
    }

    Invoke-Expression ("$DC ps")
} finally {
    Pop-Location
}

# ------------------------------------------------------------------
# 7. Remove source code; keep only runtime files
# ------------------------------------------------------------------
Log-Step "Removing source code..."

$keep = @("config", ".env", ".env.example", "infrastructure", "deploy.sh", "deploy.ps1")

Get-ChildItem $ScriptDir -Force | ForEach-Object {
    if ($keep -notcontains $_.Name) {
        Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        Log-Info "Removed: $($_.Name)"
    }
}

# ------------------------------------------------------------------
# Done
# ------------------------------------------------------------------
Log-Step "Deployment complete! ($tagName)"
Write-Host ""
Write-Host "  Dashboard  : http://localhost"       -ForegroundColor Cyan
Write-Host "  API        : http://localhost/api"   -ForegroundColor Cyan
Write-Host "  InfluxDB   : http://localhost:8086"  -ForegroundColor Cyan
Write-Host "  MQTT       : mqtt://localhost:1883"  -ForegroundColor Cyan
Write-Host ""
Write-Host "  To update  : .\deploy.ps1"
Write-Host ("  To stop    : cd infrastructure; " + $DC + " down")
Write-Host ("  To view    : cd infrastructure; " + $DC + " ps")
Write-Host ""
