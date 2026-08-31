# =============================================================================
# 🏛️ PROJECT BAZAAR — MASTER SANDBOX COMMAND CENTER CLI (v4.1.0)
# =============================================================================

$ErrorActionPreference = "Stop"

# --- ANSI Color Mappings ---
$ESC    = [char]27
$Reset  = "${ESC}[0m"
$Cyan   = "${ESC}[36m"
$Green  = "${ESC}[32m"
$Yellow = "${ESC}[33m"
$Red    = "${ESC}[31m"
$Blue   = "${ESC}[34m"
$White  = "${ESC}[97m"

function Show-Header {
    Clear-Host
    Write-Host "${Cyan}========================================================================${Reset}"
    Write-Host "${White}  ██████╗  █████╗ ███████╗ █████╗  █████╗ ██████╗ "
    Write-Host "  ██╔══██╗██╔══██╗╚══███╔╝██╔══██╗██╔══██╗██╔══██╗"
    Write-Host "  ██████╔╝███████║  ███╔╝ ███████║███████║██████╔╝"
    Write-Host "  ██╔══██╗██╔══██║ ███╔╝  ██╔══██║██╔══██║██╔══██╗"
    Write-Host "  ██████╔╝██║  ██║███████╗██║  ██║██║  ██║██║  ██║"
    Write-Host "  ╚══════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝${Reset}"
    Write-Host "${White}        L A Y E R - 2   C O M M A N D   C E N T E R${Reset}"
    Write-Host "${Cyan}========================================================================${Reset}"
    Write-Host "${Yellow}  System State: Build Verified | Workstation: Primary Node (X570)${Reset}"
    Write-Host "${Cyan}========================================================================${Reset}"
}

# --- Action Implementations (Standard Approved Verbs) ---
function Test-Diagnostics {
    Write-Host "`n${Yellow}[ACTION] Running Pre-Flight Host Diagnostics...${Reset}"
    if (Test-Path ".\solohost_dx.ps1") { 
        powershell.exe -File .\solohost_dx.ps1 
    } else { 
        Write-Host "${Red}[ERROR] solohost_dx.ps1 not found!${Reset}" 
    }
    Read-Host "`nPress Enter to return to menu"
}

function Reset-Network {
    Write-Host "`n${Yellow}[ACTION] Resetting Local Network and Cleaning Port Bindings...${Reset}"
    if (Test-Path ".\switch_nitro5_env.ps1") { 
        powershell.exe -File .\switch_nitro5_env.ps1 
    } else { 
        Write-Host "${Red}[ERROR] switch_nitro5_env.ps1 not found!${Reset}" 
    }
    Read-Host "`nPress Enter to return to menu"
}

function Start-Containers {
    Write-Host "`n${Yellow}[ACTION] Spinning Up DePIN Docker Containers...${Reset}"
    if (Test-Path ".\docker-compose-v3.yml") {
        Write-Host "${Blue}--> Running Docker Compose Up (Database, Next.js, and Daemon)...${Reset}"
        docker compose -f .\docker-compose-v3.yml up -d --build
        Write-Host "`n${Green}[SUCCESS] Containers successfully deployed on private bzr-network!${Reset}"
    } else { 
        Write-Host "${Red}[ERROR] docker-compose-v3.yml not found!${Reset}" 
    }
    Read-Host "`nPress Enter to return to menu"
}

function Initialize-Database {
    Write-Host "`n${Yellow}[ACTION] Initializing and Seeding Database...${Reset}"
    if (Test-Path ".\seed.ts") {
        Write-Host "${Blue}--> Running Seed script via Prisma and tsx...${Reset}"
        npx prisma db push --force-reset
        npx tsx .\seed.ts
        Write-Host "`n${Green}[SUCCESS] bzr-db populated with Genesis Pioneer Nodes!${Reset}"
    } else { 
        Write-Host "${Red}[ERROR] seed.ts is missing!${Reset}" 
    }
    Read-Host "`nPress Enter to return to menu"
}

function Start-Relayer {
    Write-Host "`n${Yellow}[ACTION] Starting L1/L2 Bridge Relayer Daemon...${Reset}"
    if (Test-Path ".\bazaar_relayer.ts") {
        Write-Host "${Blue}--> Spawning Relayer daemon in a separate interactive thread...${Reset}"
        Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Write-Host '🏛️ PROJECT BAZAAR L1/L2 RELAYER DAEMON'; npx tsx bazaar_relayer.ts"
        Write-Host "${Green}[SUCCESS] Relayer daemon active and polling Soroban Testnet ledgers!${Reset}"
    } else { 
        Write-Host "${Red}[ERROR] bazaar_relayer.ts not found!${Reset}" 
    }
    Read-Host "`nPress Enter to return to menu"
}

function Invoke-ClosedLoop {
    Write-Host "`n${Yellow}[ACTION] Compiling and Executing Closed-Loop Integration Suite...${Reset}"
    if (Test-Path ".\bazaar_closed_loop_test.ts") { 
        npx tsx .\bazaar_closed_loop_test.ts 
    } else { 
        Write-Host "${Red}[ERROR] bazaar_closed_loop_test.ts not found!${Reset}" 
    }
    Read-Host "`nPress Enter to return to menu"
}

function Invoke-SocialTest {
    Write-Host "`n${Yellow}[ACTION] Running Social Service and Pioneer Vault Tests...${Reset}"
    if (Test-Path ".\bazaar_social_service.ts") { 
        npx tsx .\bazaar_social_service.ts 
    } else { 
        Write-Host "${Red}[ERROR] bazaar_social_service.ts not found!${Reset}" 
    }
    Read-Host "`nPress Enter to return to menu"
}

function Stop-System {
    Write-Host "`n${Yellow}[ACTION] Tearing down Sandbox Environment...${Reset}"
    if (Test-Path ".\docker-compose-v3.yml") {
        docker compose -f .\docker-compose-v3.yml down
        Write-Host "${Green}[SUCCESS] Containers stopped and networks pruned.${Reset}"
    } else { 
        Write-Host "${Red}[ERROR] docker-compose-v3.yml not found!${Reset}" 
    }
    Read-Host "`nPress Enter to return to menu"
}

# --- Main Execution Loop ---
while ($true) {
    Show-Header
    Write-Host "  ${Cyan} 1. ${Reset} Run Pre-Flight Diagnostics (Host Hardware Audit)"
    Write-Host "  ${Cyan} 2. ${Reset} Reset Network Port Bindings and Clear Stale Processes"
    Write-Host "  ${Cyan} 3. ${Reset} Boot Container Stack (Docker Compose v3)"
    Write-Host "  ${Cyan} 4. ${Reset} Initialize and Seed Database Collections (bzr-db)"
    Write-Host "  ${Cyan} 5. ${Reset} Launch L1/L2 Bridge Relayer Daemon"
    Write-Host "  ${Cyan} 6. ${Reset} Run Closed-Loop Math and Fee-Split Simulation Test"
    Write-Host "  ${Cyan} 7. ${Reset} Test Social Fund, Emergency Aid, and Future Fund"
    Write-Host "  ${Cyan} 8. ${Reset} Complete System Tear-Down (Graceful Shutdown and Wipe)"
    Write-Host "  ${Cyan} Q. ${Reset} Exit Command Center"
    Write-Host "`n${Cyan}========================================================================${Reset}"
    
    $choice = Read-Host "Select an option"
    
    switch ($choice) {
        '1' { Test-Diagnostics }
        '2' { Reset-Network }
        '3' { Start-Containers }
        '4' { Initialize-Database }
        '5' { Start-Relayer }
        '6' { Invoke-ClosedLoop }
        '7' { Invoke-SocialTest }
        '8' { Stop-System }
        'Q' { Write-Host "${Green}Exiting Sandbox...${Reset}"; exit }
        'q' { Write-Host "${Green}Exiting Sandbox...${Reset}"; exit }
        default { Write-Host "${Red}Invalid selection. Please try again.${Reset}"; Start-Sleep -Seconds 1 }
    }
}