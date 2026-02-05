param(
    [string]$RepoPath = ".",
    [string]$SecretsFile = ".secrets",
    [switch]$Commit
)

[void] (Set-StrictMode -Version Latest)

function Fail($msg) {
    Write-Error $msg
    exit 1
}

# Ensure Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Fail "Node.js is required but was not found on PATH."
}

# Check for GH_TOKEN - try environment variables first, then secrets file, then gh CLI
if (-not $env:GH_TOKEN) {
    $env:GH_TOKEN = $env:GITHUB_TOKEN
}

if (-not $env:GH_TOKEN -and (Test-Path $SecretsFile)) {
    $match = Select-String -Path $SecretsFile -Pattern "^(GH_TOKEN|GITHUB_TOKEN)=(.+)$" | Select-Object -First 1
    if ($match) {
        $env:GH_TOKEN = $match.Matches.Groups[2].Value
    }
}

# Try to get token from GitHub CLI
if (-not $env:GH_TOKEN -and (Get-Command gh -ErrorAction SilentlyContinue)) {
    $ghToken = gh auth token 2>$null
    if ($LASTEXITCODE -eq 0 -and $ghToken) {
        $env:GH_TOKEN = $ghToken
        Write-Host "Using token from GitHub CLI." -ForegroundColor Green
    } else {
        Write-Host "GitHub CLI found but not logged in. Starting login..." -ForegroundColor Cyan
        gh auth login --scopes read:user
        if ($LASTEXITCODE -eq 0) {
            $env:GH_TOKEN = gh auth token 2>$null
        }
    }
}

if (-not $env:GH_TOKEN) {
    Write-Host "GH_TOKEN is not set. Options:" -ForegroundColor Yellow
    Write-Host "  1. Install GitHub CLI and run: gh auth login" -ForegroundColor Gray
    Write-Host "  2. Set environment variable: `$env:GH_TOKEN = 'your_token'" -ForegroundColor Gray
    Write-Host "  3. Add to $SecretsFile file: GH_TOKEN=your_token" -ForegroundColor Gray
    Fail "GH_TOKEN is required to fetch GitHub stats."
}

# Resolve and move into repo path
try {
    $RepoPath = Resolve-Path -Path $RepoPath
}
catch {
    Fail "Repo path '$RepoPath' not found."
}

Push-Location $RepoPath

# Check that the script exists
$scriptPath = "scripts/generate-stats.js"
if (-not (Test-Path $scriptPath)) {
    Pop-Location
    Fail "Script '$scriptPath' not found in repo."
}

# Run the stats generation script
Write-Host "Running: node $scriptPath" -ForegroundColor Cyan
node $scriptPath

if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Fail "node script exited with code $LASTEXITCODE"
}

# Commit changes (but do NOT push)
if ($Commit) {
    Write-Host "Staging and committing changes..." -ForegroundColor Cyan
    git add images/stats/combined-stats.svg images/pins/*.svg
    git commit -m "Update stats images"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Nothing to commit or commit failed." -ForegroundColor Yellow
    } else {
        Write-Host "Changes committed locally. Run 'git push' manually when ready." -ForegroundColor Green
    }
}

Pop-Location

Write-Host "Done." -ForegroundColor Green
