# Set root directory
Set-Location "J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha"

# Define log file
$logPath = "J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha\logs\ttl-keeper.log"
New-Item -ItemType Directory -Force -Path "J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha\logs" | Out-Null

# Timestamp and execute
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logPath -Value "=== Sweep Started: $timestamp ==="

# Execute keeper via npx tsx
npx tsx scripts/ttl-keeper.ts *>> $logPath

Add-Content -Path $logPath -Value "=== Sweep Finished: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===`n"