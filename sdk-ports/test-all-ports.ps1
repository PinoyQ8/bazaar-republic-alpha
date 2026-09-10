<#
.SYNOPSIS
    Project Bazaar: Multi-Port SDK Integration Test Suite Runner
    File Location: /sdk-ports/test-all-ports.ps1
    Version: 1.1.0 (ASCII-Compatibility Edition)
    Description:
        Aggregates and runs both the Python and PHP verification test suites natively
        under a single, unified, colorized PowerShell console dashboard.
        Fully ASCII-compatible to prevent character encoding/parsing crashes in older
        Windows PowerShell versions.
#>

$ErrorActionPreference = "Stop"

# Retrieve absolute workspace boundaries relative to the script's physical path
$pythonDir = Join-Path $PSScriptRoot "python"
$phpDir    = Join-Path $PSScriptRoot "php"

$pythonTestScript = Join-Path $pythonDir "test_verifier.py"
$phpTestScript    = Join-Path $phpDir "test_verifier.php"

# Detect Python isolated virtual environment inside our VS Code structure
$localVenvPython = Join-Path $pythonDir ".venv\Scripts\python.exe"
$pythonCmd = "python"
if (Test-Path $localVenvPython) {
    $pythonCmd = $localVenvPython
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [RUN] PROJECT BAZAAR: MULTI-PORT SDK TEST AGGREGATOR " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target Directory Root: $PSScriptRoot" -ForegroundColor DarkGray
Write-Host ""

# -----------------------------------------------------------------
# [1/2] RUN PYTHON SUITE
# -----------------------------------------------------------------
Write-Host "--- [1/2] Executing Python SDK Verifier Tests ---" -ForegroundColor Yellow
$pythonPassed = $false

try {
    # Execute the unittest module against our verified target
    $pythonProcess = Start-Process -FilePath $pythonCmd -ArgumentList "-m unittest $pythonTestScript" -NoNewWindow -PassThru -Wait -RedirectStandardOutput "python_stdout.tmp" -RedirectStandardError "python_stderr.tmp"
    
    $pythonOutput = ""
    $pythonError  = ""
    if (Test-Path "python_stdout.tmp") { $pythonOutput = Get-Content "python_stdout.tmp" -Raw }
    if (Test-Path "python_stderr.tmp") { $pythonError  = Get-Content "python_stderr.tmp" -Raw }
    
    $combinedOutput = "$pythonOutput`n$pythonError".Trim()
    
    if ($pythonProcess.ExitCode -eq 0) {
        $pythonPassed = $true
        Write-Host "  [OK] Python Test Suite executed cleanly!" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Python Test Suite failed with exit code $($pythonProcess.ExitCode)" -ForegroundColor Red
        Write-Host "----------------- Stdout/Stderr Output -----------------" -ForegroundColor DarkGray
        Write-Host $combinedOutput -ForegroundColor DarkRed
        Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
    }
} catch {
    Write-Host "  [ERROR] Failed to execute Python tests: $_" -ForegroundColor Red
} finally {
    # Clean temporary lock buffers
    if (Test-Path "python_stdout.tmp") { Remove-Item "python_stdout.tmp" -Force }
    if (Test-Path "python_stderr.tmp") { Remove-Item "python_stderr.tmp" -Force }
}

Write-Host ""

# -----------------------------------------------------------------
# [2/2] RUN PHP SUITE
# -----------------------------------------------------------------
Write-Host "--- [2/2] Executing PHP SDK Verifier Tests ---" -ForegroundColor Yellow
$phpPassed = $false

try {
    # Check if PHP is available on system PATH
    if (Get-Command "php" -ErrorAction SilentlyContinue) {
        $phpProcess = Start-Process -FilePath "php" -ArgumentList $phpTestScript -NoNewWindow -PassThru -Wait -RedirectStandardOutput "php_stdout.tmp" -RedirectStandardError "php_stderr.tmp"
        
        $phpOutput = ""
        $phpError  = ""
        if (Test-Path "php_stdout.tmp") { $phpOutput = Get-Content "php_stdout.tmp" -Raw }
        if (Test-Path "php_stderr.tmp") { $phpError  = Get-Content "php_stderr.tmp" -Raw }
        
        $combinedOutput = "$phpOutput`n$phpError".Trim()
        
        if ($phpProcess.ExitCode -eq 0) {
            $phpPassed = $true
            Write-Host "  [OK] PHP Test Suite executed cleanly!" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] PHP Test Suite failed with exit code $($phpProcess.ExitCode)" -ForegroundColor Red
            Write-Host "----------------- Stdout/Stderr Output -----------------" -ForegroundColor DarkGray
            Write-Host $combinedOutput -ForegroundColor DarkRed
            Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "  [FAIL] PHP execution failed: 'php' interpreter not found in system Path." -ForegroundColor Red
        Write-Host "  Please ensure Scoop PHP is installed and registered." -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ERROR] Failed to execute PHP tests: $_" -ForegroundColor Red
} finally {
    # Clean temporary lock buffers
    if (Test-Path "php_stdout.tmp") { Remove-Item "php_stdout.tmp" -Force }
    if (Test-Path "php_stderr.tmp") { Remove-Item "php_stderr.tmp" -Force }
}

Write-Host ""

# -----------------------------------------------------------------
# [STATUS] UNIFIED BUILD HEALTH DASHBOARD
# -----------------------------------------------------------------
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [STATUS] UNIFIED PORT VALIDATION DASHBOARD" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if ($pythonPassed) {
    Write-Host "  [PASS] Python SDK Verifier (6/6 Mock Assertions Handled)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Python SDK Verifier - Check Logs for Traceback" -ForegroundColor Red
}

if ($phpPassed) {
    Write-Host "  [PASS] PHP SDK Verifier    (15/15 Namespace-Mock Assertions Handled)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] PHP SDK Verifier    - Check Logs for Exception" -ForegroundColor Red
}

Write-Host "==========================================================" -ForegroundColor Cyan

if ($pythonPassed -and $phpPassed) {
    Write-Host "  [SUCCESS] All community ports are 100% healthy!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "  [FAILURE] One or more community ports have build errors." -ForegroundColor Red
    exit 1
}
