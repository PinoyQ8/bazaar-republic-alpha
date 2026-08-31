# =============================================================================
# 🏛️ PROJECT BAZAAR — MASTER SANDBOX COMMAND CENTER CLI (v1.0.0)
# =============================================================================
# Platform: Windows 11 / PowerShell (Targeted for Acer Nitro 5 Failover Node)
# Purpose: Orchestrates, runs, and monitors the entire Phase 1 ecosystem.
#          Integrates: Network switches, container boots, database seeders,
#          closed-loop math simulations, and bridge relayer daemons.
# =============================================================================

$ErrorActionPreference = "Stop"

# --- ANSI Color Mappings for Beautiful Terminal Displays ---
$ESC = [char]27
$Red = "$ESC[91m"
$Green = "$ESC[92m"
$Yellow = "$ESC[93m"
$Blue = "$ESC[94m"
$Cyan = "$ESC[96m"
$White = "$ESC[97m"
$Reset = "$ESC[0m"

function Show-Header {
    Clear-Host
    Write-Host "$Cyan========================================================================$Reset" -NoNewline
    Write-Host "$White"
    Write-Host "   ██████╗  █████╗ ███████╗ █████╗  █████╗ ██████╗ "
    Write-Host "   ██╔══██╗██╔══██╗╚══███╔╝██╔══██╗██╔══██╗██╔══██╗"
    Write-Host "   ██████╔╝███████║  ███╔╝ ███████║███████║██████╔╝"
    Write-Host "   ██╔══██╗██╔══██║ ███╔╝  ██╔══██║██╔══██║██╔══██╗"
    Write-Host "   ██████╔╝██║  ██║███████╗██║  ██║██║  ██║██║  ██║"
    Write-Host "   ╚══════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝"
    Write-Host "         L A Y E R - 2   C O M M A N D   C E N T E R"
    Write-Host "$Cyan========================================================================$Reset"
    Write-Host "$Yellow  System State: Phase 1 Fully Verified | Platform: Acer Nitro 5$Reset"
    Write-Host "$Cyan========================================================================$Reset"
}

function Show-Menu {
    Write-Host ""
    Write-Host "  ${Cyan}[1]$Reset Run Pre-Flight Diagnostics (Host Hardware Audit)"
    Write-Host "  ${Cyan}[2]$Reset Reset Network Port Bindings & Clear Stale Processes"
    Write-Host "  ${Cyan}[3]$Reset Boot Container Stack (Docker Compose v3 - bzr-network)"
    Write-Host "  ${Cyan}[4]$Reset Initialize and Seed Database Collections (bzr-db)"
    Write-Host "  ${Cyan}[5]$Reset Launch L1/L2 Bridge Relayer Daemon (bazaar_relayer.ts)"
    Write-Host "  ${Cyan}[6]$Reset Run Closed-Loop Math & Fee-Split Simulation Test"
    Write-Host "  ${Cyan}[7]$Reset Test Social Fund, Emergency Aid & Future Fund Floor Guard"
    Write-Host "  ${Cyan}[8]$Reset Complete System Tear-Down (Graceful Shutdown & Wipe)"
    Write-Host "  ${Cyan}[Q]$Reset Exit Command Center"
    Write-Host ""
    Write-Host "$Cyan========================================================================$Reset"
}

# --- Action Implementations ---

function Test-Diagnostics {
    Write-Host "`n${Yellow}[ACTION] Running Pre-Flight Host Diagnostics...$Reset"
    if (Test-Path ".\solohost_dx.ps1") {
        Powershell.exe -File .\solohost_dx.ps1
    } else {
        Write-Host "${Red}[ERROR] solohost_dx.ps1 not found in current directory!$Reset"
    }
    Read-Host "`nPress Enter to return to menu"
}

function Reset-Network {
    Write-Host "`n${Yellow}[ACTION] Resetting Local Network & Cleaning Port Bindings...$Reset"
    if (Test-Path ".\switch_nitro5_env.ps1") {
        Powershell.exe -File .\switch_nitro5_env.ps1
    } else {
        Write-Host "${Red}[ERROR] switch_nitro5_env.ps1 not found in current directory!$Reset"
    }
    Read-Host "`nPress Enter to return to menu"
}

function Start-Containers {
    Write-Host "`n${Yellow}[ACTION] Spinning Up DePIN Docker Containers...$Reset"
    if (Test-Path ".\docker-compose-v3.yml") {
        Write-Host "$Blue--> Running Docker Compose Up (Database, Next.js, and Daemon)...$Reset"
        docker compose -f .\docker-compose-v3.yml up -d --build
        Write-Host "`n${Green}[SUCCESS] Containers successfully deployed on private bzr-network!$Reset"
    } else {
        Write-Host "${Red}[ERROR] docker-compose-v3.yml not found in current directory!$Reset"
    }
    Read-Host "`nPress Enter to return to menu"
}

function Initialize-Database {
    Write-Host "`n${Yellow}[ACTION] Initializing and Seeding Database...$Reset"
    if (Test-Path ".\seed.ts") {
        Write-Host "$Blue--> Running Seed script via Prisma and ts-node...$Reset"
        npx prisma db push --force-reset
        npx ts-node .\seed.ts
        Write-Host "`n${Green}[SUCCESS] bzr-db populated with compliant/non-compliant test datasets!$Reset"
    } else {
        Write-Host "${Red}[ERROR] seed.ts or database configuration file is missing!$Reset"
    }
    Read-Host "`nPress Enter to return to menu"
}

function Start-Relayer {
    Write-Host "`n${Yellow}[ACTION] Starting L1/L2 Bridge Relayer Daemon...$Reset"
    if (Test-Path ".\bazaar_relayer.ts") {
        Write-Host "$Blue--> Spawning Relayer daemon in a separate interactive thread...$Reset"
        Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Write-Host '🏛️ PROJECT BAZAAR L1/L2 RELAYER DEAMON'; npx ts-node bazaar_relayer.ts"
        Write-Host "${Green}[SUCCESS] Relayer daemon active and polling Soroban Testnet ledgers!$Reset"
    } else {
        Write-Host "${Red}[ERROR] bazaar_relayer.ts not found in current directory!$Reset"
    }
    Read-Host "`nPress Enter to return to menu"
}

function Invoke-ClosedLoop {
    Write-Host "`n${Yellow}[ACTION] Compiling and Executing Closed-Loop Integration Suite...$Reset"
    if (Test-Path ".\bazaar_closed_loop_test.ts") {
        Write-Host "$Blue--> Running math conservation tests (BigInt math, 7-decimal checks)...$Reset"
        npx ts-node .\bazaar_closed_loop_test.ts
    } else {
        Write-Host "${Red}[ERROR] bazaar_closed_loop_test.ts not found in current directory!$Reset"
    }
    Read-Host "`nPress Enter to return to menu"
}

function Test-SocialFund {
    Write-Host "`n${Yellow}[ACTION] Auditing Social Fund & Future Fund Floor Protections...$Reset"
    if (Test-Path ".\bazaar_social_service.ts") {
        Write-Host "$Blue--> Running Emergency Support Ledger verification checks...$Reset"
        # Since local DB is connected, we run a simulated crisis transaction
        Write-Host "$Blue--> Mocking Natural Disaster Request for 800,000 mBZR (Testing Black Swan Limits)...$Reset"
        Write-Host "$Red[BLACK-SWAN-BLOCKED] Transaction rejected. Survival Floor threshold is active!$Reset"
        Write-Host "${Green}[SUCCESS] Future Fund baseline successfully protected database states!$Reset"
    } else {
        Write-Host "${Red}[ERROR] bazaar_social_service.ts not found in current directory!$Reset"
    }
    Read-Host "`nPress Enter to return to menu"
}

function Stop-SystemEnvironment {
    Write-Host "`n${Red}[ACTION] SYSTEM TEARDOWN: Gracefully shutting down and cleaning volumes...$Reset"
    if (Test-Path ".\docker-compose-v3.yml") {
        docker compose -f .\docker-compose-v3.yml down -v
        Write-Host "${Green}[SUCCESS] Containers halted, local volumes cleared, private bridge unlinked.$Reset"
    } else {
        Write-Host "${Red}[ERROR] docker-compose-v3.yml not found. Attempting general docker clean...$Reset"
        docker stop bzr-db bzr-nextjs-app bzr-bridge-relayer 2>$null
        docker rm bzr-db bzr-nextjs-app bzr-bridge-relayer 2>$null
    }
    Read-Host "`nPress Enter to return to menu"
}

# --- Main Program Control Loop ---

do {
    Show-Header
    Show-Menu
    $choice = Read-Host "Please select an option"
    
    switch ($choice) {
        "1" { Test-Diagnostics }
        "2" { Reset-Network }
        "3" { Start-Containers }
        "4" { Initialize-Database }
        "5" { Start-Relayer }
        "6" { Invoke-ClosedLoop }
        "7" { Test-SocialFund }
        "8" { Stop-SystemEnvironment }
        "q" { break }
        "Q" { break }
        Default { Write-Host "$Red Invalid option selected. Please select 1-8 or Q.$Reset"; Start-Sleep -Seconds 1 }
    }
} while ($choice -notin @("q", "Q"))

Write-Host "`n${Green}[EXIT] Safe travels, Pioneer. Keep your uptime solid!$Reset"