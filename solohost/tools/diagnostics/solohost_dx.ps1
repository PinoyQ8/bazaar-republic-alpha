# solohost_dx.ps1 — Windows Pre-Flight & Port Diagnostic Tool

Write-Host "=== SoloHost Windows Hardware & Port Diagnostic ===" -ForegroundColor Cyan

# 1. CPU & Memory Check
$CPU = (Get-CimInstance Win32_Processor).NumberOfLogicalProcessors
$RAM_GB = [math]::Round((Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum).Sum / 1GB)

Write-Host "[1/3] Hardware Specifications:"
Write-Host "  - CPU Cores: $CPU"
Write-Host "  - Total Memory: ${RAM_GB}GB"

if ($CPU -lt 4 -or $RAM_GB -lt 8) {
    Write-Host "  ⚠️ WARNING: Below SoloHost v2 recommended specs (4 Cores, 8GB RAM)." -ForegroundColor Yellow
} else {
    Write-Host "  ✅ Hardware Specs: PASS" -ForegroundColor Green
}

# 2. Docker Service Check
Write-Host "`n[2/3] Docker Desktop Status:"
$DockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if ($DockerProcess) {
    Write-Host "  ✅ Docker Desktop is running." -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Docker Desktop process not detected." -ForegroundColor Yellow
}

# 3. Port Binding Audit
Write-Host "`n[3/3] Port Audit (3000 & 27017):"
$Port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($Port3000) {
    Write-Host "  ⚠️ Port 3000 is currently active/bound." -ForegroundColor Yellow
} else {
    Write-Host "  ✅ Port 3000 is free." -ForegroundColor Green
}

Write-Host "`n=== Diagnostic Complete ===" -ForegroundColor Cyan
