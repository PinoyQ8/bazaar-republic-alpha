# solohost_dx.ps1 — Windows Pre-Flight & Port Diagnostic Tool

Write-Host "=== SoloHost Windows Hardware & Port Diagnostic ===" -ForegroundColor Cyan

# 1. CPU & Memory Check
$CpuSum = (Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue | Measure-Object -Property NumberOfLogicalProcessors -Sum).Sum
$CPU = if ($CpuSum) { [int]$CpuSum } else { [int]$env:NUMBER_OF_PROCESSORS }

$MemSum = (Get-CimInstance Win32_PhysicalMemory -ErrorAction SilentlyContinue | Measure-Object -Property Capacity -Sum).Sum
$RAM_GB = if ($MemSum) { [math]::Round([double]$MemSum / 1GB) } else { 0 }

Write-Host "[1/3] Hardware Specifications:"
Write-Host "  - CPU Cores: $CPU"
Write-Host "  - Total Memory: ${RAM_GB}GB"

if ($CPU -lt 4 -or $RAM_GB -lt 8) {
    Write-Host "  [WARN] Below SoloHost v2 recommended specs (4 Cores, 8GB RAM)." -ForegroundColor Yellow
} else {
    Write-Host "  [PASS] Hardware Specs: PASS" -ForegroundColor Green
}

# 2. Docker Service Check
Write-Host "`n[2/3] Docker Desktop & Engine Status:"
$DockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if ($DockerProcess) {
    Write-Host "  [PASS] Docker Desktop process is running." -ForegroundColor Green
} else {
    Write-Host "  [WARN] Docker Desktop process not detected." -ForegroundColor Yellow
}

$DockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if ($DockerCmd) {
    docker info *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [PASS] Docker daemon is responsive." -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Docker CLI found, but daemon did not respond." -ForegroundColor Yellow
    }
} else {
    Write-Host "  [WARN] Docker CLI not found in PATH." -ForegroundColor Yellow
}

# 3. Port Binding Audit
Write-Host "`n[3/3] Port Audit (3000 & 27017):"
$Port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($Port3000) {
    Write-Host "  [WARN] Port 3000 is currently listening/bound." -ForegroundColor Yellow
} else {
    Write-Host "  [PASS] Port 3000 is free." -ForegroundColor Green
}

$Port27017 = Get-NetTCPConnection -LocalPort 27017 -State Listen -ErrorAction SilentlyContinue
if ($Port27017) {
    Write-Host "  [WARN] Port 27017 is currently listening/bound." -ForegroundColor Yellow
} else {
    Write-Host "  [PASS] Port 27017 is free." -ForegroundColor Green
}

Write-Host "`n=== Diagnostic Complete ===" -ForegroundColor Cyan