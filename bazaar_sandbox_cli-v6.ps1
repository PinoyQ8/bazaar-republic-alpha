# =============================================================================
# 🏛️ PROJECT BAZAAR — MASTER SANDBOX COMMAND CENTER CLI (v6.2.0)
# =============================================================================
# Platform: Windows 11 / PowerShell (Targeted for Primary X570 & Failover Nodes)
# Purpose: Orchestrates container fleet, database seeding, bridge relayer, 
#          and closed-loop cryptographic math simulations.
# =============================================================================

$ErrorActionPreference = "Stop"

# --- ANSI Color Mappings ---
$ESC    = [char]27
$Reset  = "$ESC[0m"
$Cyan   = "$ESC[36m"
$Green  = "$ESC[32m"
$Yellow = "$ESC[93m"
$Red    = "$ESC[91m"
$Blue   = "$ESC[94m"
$White  = "$ESC[97m"

function Show-Header {
    Clear-Host
    Write-Host "$Cyan========================================================================$Reset"
    Write-Host "$White  ██████╗  █████╗ ███████╗ █████╗  █████╗ ██████╗ $Reset"
    Write-Host "$White  ██╔══██╗██╔══██╗╚══███╔╝██╔══██╗██╔══██╗██╔══██╗$Reset"
    Write-Host "$White  ██████╔╝███████║  ███╔╝ ███████║███████║██████╔╝$Reset"
    Write-Host "$White  ██╔══██╗██╔══██║ ███╔╝  ██╔══██║██╔══██║██╔══██╗$Reset"
    Write-Host "$White  ██████╔╝██║  ██║███████╗██║  ██║██║  ██║██║  ██║$Reset"
    Write-Host "$White  ╚══════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝$Reset"
    Write-Host "$White        L A Y E R - 2   C O M M A N D   C E N T E R$Reset"
    Write-Host "$Cyan========================================================================$Reset"
    Write-Host "$Yellow  System State: Phase 1 Fully Verified | Platform: Acer Nitro 5 / X570$Reset"
    Write-Host "$Cyan========================================================================$Reset"
}

# --- Action Implementations (Standard Approved Verbs) ---

function Test-Diagnostics {
    Write-Host ""
    Write-Host "$Yellow[ACTION] Running Pre-Flight Host Diagnostics...$Reset"
    if (Test-Path ".\solohost_dx.ps1") { 
        powershell.exe -File .\solohost_dx.ps1 
    } else { 
        Write-Host "$Red[ERROR] solohost_dx.ps1 not found!$Reset" 
    }
    Read-Host "`nPress Enter to return to menu"
}

function Reset-Network {
    Write-Host ""
    Write-Host "$Yellow[ACTION] Resetting Local Network and Cleaning Port Bindings...$Reset"
    if (Test-Path ".\switch_nitro5_env.ps1") { 
        powershell.exe -File .\switch_nitro5_env.ps1 
    } else { 
        Write-Host "$Red[ERROR] switch_nitro5_env.ps1 not found!$Reset" 
    }
    Read-Host "`nPress Enter to return to menu"
}

function Start-Containers {
    Write-Host ""
    Write-Host "$Yellow[ACTION] Spinning Up DePIN Docker Containers...$Reset"
    $composeFile = if (Test-Path ".\docker-compose-v3.yml") { ".\docker-compose-v3.yml" } else { ".\docker-compose.yml" }
    
    if (Test-Path $composeFile) {
        Write-Host "$Blue -> Running Docker Compose ($composeFile)...$Reset"
        docker compose -f $composeFile up -d --build
        Write-Host ""
        Write-Host "$Green[SUCCESS] Containers successfully deployed on private bzr-network!$Reset"
    } else { 
        Write-Host "$Red[ERROR] docker-compose configuration file not found!$Reset" 
    }
    Read-Host "`nPress Enter to return to menu"
}

function Initialize-Database {
    Write-Host ""
    Write-Host "$Yellow[ACTION] Initializing and Seeding Database...$Reset"
    if (Test-Path ".\seed.ts") {
        Write-Host "$Blue -> Running Database Push & Seeding Genesis Nodes...$Reset"
        npx prisma db push --force-reset
        npx tsx .\seed.ts
        Write-Host ""
        Write-Host "$Green[SUCCESS] bzr-db populated with Genesis Pioneer Nodes!$Reset"
    } else { 
        Write-Host "$Red[ERROR] seed.ts is missing!$Reset" 
    }
    Read-Host "`nPress Enter to return to menu"
}

function Start-Relayer {
    Write-Host ""
    Write-Host "$Yellow[ACTION] Starting L1/L2 Bridge Relayer Daemon...$Reset"
    if (Test-Path ".\bazaar_relayer.ts") {
        Write-Host "$Blue -> Spawning Relayer daemon in interactive process...$Reset"
        Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Write-Host '🏛️ PROJECT BAZAAR L1/L2 RELAYER DAEMON'; npx tsx bazaar_relayer.ts"
        Write-Host "$Green[SUCCESS] Relayer daemon active and polling Soroban Testnet ledgers!$Reset"
    } else { 
        Write-Host "$Red[ERROR] bazaar_relayer.ts not found!$Reset" 
    }
    Read-Host "`nPress Enter to return to menu"
}

function Invoke-ClosedLoop {
    Write-Host ""
    Write-Host "$Yellow[ACTION] Compiling and Executing Closed-Loop Integration Suite...$Reset"
    if (Test-Path ".\bazaar_closed_loop_test.ts") { 
        npx tsx .\bazaar_closed_loop_test.ts 
    } else { 
        Write-Host "$Red[ERROR] bazaar_closed_loop_test.ts not found!$Reset" 
    }
    Read-Host "`nPress Enter to return to menu"
}

function Invoke-SocialTest {
    Write-Host ""
    Write-Host "$Yellow[ACTION] Running Social Service and Pioneer Vault Tests...$Reset"
    if (Test-Path ".\bazaar_social_service.ts") { 
        npx tsx .\bazaar_social_service.ts 
    } else { 
        Write-Host "$Red[ERROR] bazaar_social_service.ts not found!$Reset" 
    }
    Read-Host "`nPress Enter to return to menu"
}

function Stop-System {
    Write-Host ""
    Write-Host "$Yellow[ACTION] Tearing down Sandbox Environment...$Reset"
    $composeFile = if (Test-Path ".\docker-compose-v3.yml") { ".\docker-compose-v3.yml" } else { ".\docker-compose.yml" }
    
    if (Test-Path $composeFile) {
        docker compose -f $composeFile down
        Write-Host "$Green[SUCCESS] Containers stopped and networks pruned.$Reset"
    } else { 
        Write-Host "$Red[ERROR] docker-compose configuration file not found!$Reset" 
    }
    Read-Host "`nPress Enter to return to menu"
}

# --- Main Execution Loop ---
while ($true) {
    Show-Header
    Write-Host "  ${Cyan}1.${Reset} Run Pre-Flight Diagnostics (Host Hardware Audit)"
    Write-Host "  ${Cyan}2.${Reset} Reset Network Port Bindings and Clear Stale Processes"
    Write-Host "  ${Cyan}3.${Reset} Boot Container Stack (Docker Compose v3)"
    Write-Host "  ${Cyan}4.${Reset} Initialize and Seed Database Collections (bzr-db)"
    Write-Host "  ${Cyan}5.${Reset} Launch L1/L2 Bridge Relayer Daemon"
    Write-Host "  ${Cyan}6.${Reset} Run Closed-Loop Math and Fee-Split Simulation Test"
    Write-Host "  ${Cyan}7.${Reset} Test Social Fund, Emergency Aid and Future Fund"
    Write-Host "  ${Cyan}8.${Reset} Complete System Tear-Down (Graceful Shutdown and Wipe)"
    Write-Host "  ${Cyan}Q.${Reset} Exit Command Center"
    Write-Host ""
    Write-Host "$Cyan========================================================================$Reset"
    
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
        'Q' { Write-Host "$Green Exiting Sandbox...$Reset"; exit }
        'q' { Write-Host "$Green Exiting Sandbox...$Reset"; exit }
        default { 
            Write-Host "$Red Invalid selection. Please try again.$Reset"
            Start-Sleep -Seconds 1 
        }
    }
}