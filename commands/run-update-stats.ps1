param(
    [string]$RepoPath = ".",
    [string]$Workflow = ".github/workflows/update-stats.yml",
    [string]$SecretsFile = ".secrets",
    [string]$Job = "update-stats",
    [string]$Image = "node:16-bullseye",
    [switch]$NoPrePull
)

[void] (Set-StrictMode -Version Latest)

function Fail($msg) {
    Write-Error $msg
    exit 1
}

# Ensure 'act' is available early and give install hints
if (-not (Get-Command act -ErrorAction SilentlyContinue)) {
    Write-Host "The 'act' tool is required but was not found on PATH." -ForegroundColor Yellow
    Write-Host "Install options (choose one):" -ForegroundColor Yellow
    Write-Host "  Scoop (recommended):`n    iwr -useb get.scoop.sh | iex`n    scoop install act" -ForegroundColor Gray
    Write-Host "  Chocolatey: choco install act" -ForegroundColor Gray
    Write-Host "  WSL / Linux (example):`n    curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash" -ForegroundColor Gray
    Write-Host "  Manual & other options: https://github.com/nektos/act" -ForegroundColor Gray
    Fail "'act' not found. Install it and re-run this script."
}

# Resolve and move into repo path
try {
    $RepoPath = Resolve-Path -Path $RepoPath
}
catch {
    Fail "Repo path '$RepoPath' not found."
}

Push-Location $RepoPath

# Check Docker is available
try {
    docker version | Out-Null
}
catch {
    Fail "Docker is not available or not running. Start Docker Desktop (WSL2 recommended)."
}

# Helper: try to pull an image with timeout and return success/failure
function Try-PullImage {
    param(
        [string]$Image,
        [int]$TimeoutSec = 180
    )

    Write-Verbose "Attempting docker pull $Image (timeout ${TimeoutSec}s)"
    try {
        $p = Start-Process -FilePath docker -ArgumentList @('pull', $Image) -NoNewWindow -PassThru -ErrorAction Stop
    }
    catch {
        Write-Verbose ("Failed to start docker pull for {0}: {1}" -f $Image, $_)
        return $false
    }

    # Wait up to timeout seconds
    try {
        Wait-Process -Id $p.Id -Timeout $TimeoutSec -ErrorAction SilentlyContinue
    }
    catch {
        # ignore
    }

    if (-not $p.HasExited) {
        Write-Verbose "docker pull appears to be hanging for $Image; terminating after timeout"
        try { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } catch {}
        return $false
    }

    if ($p.ExitCode -ne 0) {
        Write-Verbose "docker pull exited with code $($p.ExitCode) for $Image"
        return $false
    }

    # Basic verification the image exists locally
    $exists = docker images --format "{{.Repository}}:{{.Tag}}" | Where-Object { $_ -like "*$($Image.Split(':')[0])*" }
    if (-not $exists) {
        Write-Verbose "docker pull completed but image not found locally for $Image"
        return $false
    }

    return $true
}

# Pre-pull candidate images unless user disabled it
$ChosenImage = $Image
if (-not $NoPrePull) {
    $candidates = @($Image, 'ghcr.io/catthehacker/ubuntu:full-20.04', 'nektos/act-environments-ubuntu:18.04', 'ubuntu:20.04') | Select-Object -Unique
    $pulled = $false
    foreach ($img in $candidates) {
        Write-Host "Pre-pulling: $img" -ForegroundColor Cyan
        if (Try-PullImage -Image $img -TimeoutSec 180) {
            Write-Host "Pulled: $img" -ForegroundColor Green
            $ChosenImage = $img
            $pulled = $true
            break
        }
        else {
            Write-Host "Failed to pull: $img" -ForegroundColor Yellow
        }
    }
    if (-not $pulled) {
        Write-Warning "Pre-pull failed for all candidates. 'act' may still attempt to pull and stall."
        Write-Host "Try manual pull or check Docker Desktop/network/proxy settings: docker pull $Image" -ForegroundColor Gray
    }
}
else {
    Write-Verbose "Skipping pre-pull due to -NoPrePull"
}

if (-not (Test-Path $Workflow)) {
    Fail "Workflow file '$Workflow' not found in repo."
}

if (-not (Test-Path $SecretsFile)) {
    Write-Warning "Secrets file '$SecretsFile' not found. You can create one with GITHUB_TOKEN=..."
}

# Build act command
$argsList = @(
    '-W', $Workflow,
    '-j', $Job
)

if (Test-Path $SecretsFile) {
    $argsList += @('--secret-file', $SecretsFile)
}

$argsList += @('-P', "ubuntu-latest=$ChosenImage")

Write-Host "Running: act $($argsList -join ' ')" -ForegroundColor Cyan

$proc = Start-Process -FilePath act -ArgumentList $argsList -NoNewWindow -Wait -PassThru
if ($proc.ExitCode -ne 0) {
    Fail "act exited with code $($proc.ExitCode)"
}

Pop-Location

Write-Host "Done." -ForegroundColor Green
