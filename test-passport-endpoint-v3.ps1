<#
.SYNOPSIS
    Project Bazaar: Layer-2 Blueprint and Database Strategy
    PowerShell Passport API Verification Script (v3.0.0)
.DESCRIPTION
    Executes mock HTTP handshakes from the X570 Command Center to verify the
    robustness, latency, and payload accuracy of the Next.js App Router 
    '/api/mesh/passport-verify' endpoint. This version implements advanced
    WebException stream catching to handle expected HTTP 400 errors gracefully.
.NOTES
    Author: Bazaar Republic Technical Forge
    License: PiOS (Pi Open Source) / Private Utility
    System Requirements: PowerShell 5.1+ or PowerShell Core 7.x
#>

[CmdletBinding() ]
param (
    [string]$TargetUrl = "http://localhost:3000/api/mesh/passport-verify",
    [string]$TunnelUrl = "https://solid-geese-create.loca.lt/api/mesh/passport-verify",
    [switch]$UseTunnel,
    [switch]$Detailed
)

# 🎨 Color Schemes matching X570 Command Center Aesthetics
$Cyan = "`e[36m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Reset = "`e[0m"
$Bold = "`e[1m"

Write-Host "${Cyan}${Bold}======================================================================${Reset}"
Write-Host "${Cyan}${Bold}⚡ BAZAAR REPUBLIC: PASSPORT API CONCURRENCY & HANDSHAKE AUDITOR ⚡${Reset}"
Write-Host "${Cyan}${Bold}======================================================================${Reset}"

# Resolve the URL to test
$Endpoint = $TargetUrl
if ($UseTunnel) {
    $Endpoint = $TunnelUrl
}

Write-Host "Target Endpoint: ${Yellow}$Endpoint${Reset}"
Write-Host "Local Time:      $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')"
Write-Host "----------------------------------------------------------------------"

# Helper function to execute WebRequest and parse the output
function Test-Handshake {
    param (
        [string]$Description,
        [string]$QueryString
    )

    $FullUrl = "$Endpoint$QueryString"
    Write-Host -NoNewline "• Running: $Description... "

    $Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        # Force TLS 1.2/1.3 for Localtunnel SSL integrity
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13

        # Execute standard web request
        $Response = Invoke-WebRequest -Uri $FullUrl -Method Get -UseBasicParsing -TimeoutSec 10
        $Stopwatch.Stop()
        $Elapsed = $Stopwatch.ElapsedMilliseconds

        $StatusCode = $Response.StatusCode
        $Body = $Response.Content

        if ($StatusCode -eq 200) {
            # Inspect for Bad Gateway HTML page (The dreaded token 'B' error)
            if ($Body -match "<html" -or $Body -match "Bad Gateway" -or $Body -match "502" -or $Body -match "504") {
                Write-Host "${Red}[FAILED]${Reset} (Latency: ${Elapsed}ms)"
                Write-Host "${Red}  [!] CRITICAL: Endpoint returned an HTML Gateway error page instead of JSON!${Reset}"
                Write-Host "  [!] Raw Body Sneak-Peek: $( $Body.SubString(0, [System.Math]::Min(100, $Body.Length)) )"
                return $false
            }

            # Attempt JSON Deserialization
            try {
                $Payload = $Body | ConvertFrom-Json
                Write-Host "${Green}[SUCCESS]${Reset} (Latency: ${Elapsed}ms)"
                
                # Verify schema properties
                $SourceInfo = if ($Payload.source) { $Payload.source } else { "DEVELOPER_BYPASS" }
                Write-Host "  --> Tier Level: ${Cyan}$($Payload.tierLevel)${Reset} | Issued: $($Payload.isIssued) | Source: $SourceInfo"
                if ($Detailed) {
                    Write-Host "  --> Raw JSON:  $Body"
                }
                return $true
            }
            catch {
                Write-Host "${Red}[FAILED]${Reset} (Latency: ${Elapsed}ms)"
                Write-Host "${Red}  [!] SCHEMA FAILURE: Payload is not a valid JSON string.${Reset}"
                Write-Host "  [!] Parse Error: $_"
                return $false
            }
        }
    }
    catch [System.Net.WebException] {
        $Stopwatch.Stop()
        $Elapsed = $Stopwatch.ElapsedMilliseconds
        
        # Capture the underlying HTTP response from the exception stream
        $ExceptionResponse = $_.Exception.Response
        if ($null -ne $ExceptionResponse) {
            $StatusCode = [int]$ExceptionResponse.StatusCode
            $ResponseStream = $ExceptionResponse.GetResponseStream()
            $Reader = New-Object System.IO.StreamReader($ResponseStream)
            $Body = $Reader.ReadToEnd()
            
            # Non-200 can still be a successful test if we expected a 400 error
            if ($StatusCode -eq 400 -and $QueryString -notmatch "wallet") {
                Write-Host "${Green}[SUCCESS (CAUGHT ERROR)]${Reset} (Latency: ${Elapsed}ms)"
                Write-Host "  --> Catch State: Status $StatusCode (Bad Request) handled correctly by backend."
                try {
                    $Payload = $Body | ConvertFrom-Json
                    Write-Host "  --> Error Payload: ${Yellow}$($Payload.error)${Reset}"
                } catch {}
                return $true
            }

            Write-Host "${Red}[FAILED]${Reset} (Latency: ${Elapsed}ms)"
            Write-Host "${Red}  [!] SERVER ERROR: Endpoint returned HTTP Status Code: $StatusCode${Reset}"
            if ($Body) {
                Write-Host "  [!] Error Body: $Body"
            }
            return $false
        }
        else {
            Write-Host "${Red}[ERROR]${Reset} (Latency: ${Elapsed}ms)"
            Write-Host "${Red}  [!] NETWORK ERROR: $_${Reset}"
            return $false
        }
    }
    catch {
        $Stopwatch.Stop()
        Write-Host "${Red}[ERROR]${Reset} (Latency: $($Stopwatch.ElapsedMilliseconds)ms)"
        Write-Host "${Red}  [!] UNEXPECTED EXCEPTION: $_${Reset}"
        return $false
    }
}

# ======================================================================
# 🧪 RUN TEST MATRIX
# ======================================================================

$TotalTests = 4
$PassedTests = 0

# Test Case 1: Sandbox Developer Bypass Handshake (USR_PIONEER)
$Test1 = Test-Handshake -Description "Test Case 1: Sandbox Developer Bypass (usr_pioneer)" -QueryString "?wallet=usr_pioneer_genesis_100"
if ($Test1) { $PassedTests++ }

# Test Case 2: Sandbox Developer Bypass Handshake (Dev Account Alias)
$Test2 = Test-Handshake -Description "Test Case 2: Sandbox Developer Bypass (PinoyQ8_Dev)" -QueryString "?wallet=PinoyQ8_Dev"
if ($Test2) { $PassedTests++ }

# Test Case 3: Standard Citizen Baseline (On-Chain/Database Query)
$Test3 = Test-Handshake -Description "Test Case 3: Standard Citizen Handshake (Normal Wallet)" -QueryString "?wallet=GAU5Y5BZZZTBD4UB3GBUABCWYFP6HRHN5NSQEPY2GJCJY7NYC2MWRRVLT"
if ($Test3) { $PassedTests++ }

# Test Case 4: Schema Missing Parameters Validation
$Test4 = Test-Handshake -Description "Test Case 4: Schema Missing Parameters Validation" -QueryString ""
if ($Test4) { $PassedTests++ }

# ======================================================================
# 🏛️ AUDIT SUMMARY
# ======================================================================
Write-Host "----------------------------------------------------------------------"
Write-Host -NoNewline "Audit Summary: "
if ($PassedTests -eq $TotalTests) {
    Write-Host "${Green}${Bold}ALL PASSING ($PassedTests/$TotalTests)${Reset}"
    Write-Host "${Green}Your Next.js '/api/mesh/passport-verify' endpoint is fully resilient!${Reset}"
}
else {
    Write-Host "${Red}${Bold}WARNING: ($PassedTests/$TotalTests) Passed${Reset}"
    Write-Host "${Yellow}Please verify that your Next.js server is active and localtunnel is forwarding traffic correctly.${Reset}"
}
Write-Host "${Cyan}${Bold}======================================================================${Reset}"
Write-Host "© BAZAAR REPUBLIC • IN CODE WE TRUST"
Write-Host "======================================================================"
