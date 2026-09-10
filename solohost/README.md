# 🚀 SoloHost Community Starter Kit

**Version:** 1.0.0  
**Author:** Bazaar Republic Alpha / Project Bazaar Core Team  
**License:** MIT / PiOS Community Contribution  

---

## 📋 Overview
This starter kit provides Pi Network developers and SoloHost node operators with enterprise-grade manifest configurations, pre-flight diagnostic scripts, and multi-language Server-to-Server (S2S) payment verification engines.

---

## 🛠️ File 1: `config_options.yml`
*Save this file to your project root to define the Pi Desktop graphical setup wizard.*

```yaml
# config_options.yml — SoloHost UI Configuration Schema
title: SoloHost Application Configuration
description: Configure environment parameters for your containerized Pi Network node application.
output_file: .env

fixed_values:
  - name: UID
    detect: uid            # Auto-resolves host user ID
  - name: NODE_ENV
    value: production

fields:
  - name: MONGODB_URI
    label: MongoDB Connection URI
    type: text
    required: true
    default: mongodb://host.docker.internal:27017/bazaar_republic?directConnection=true
    help: Enter the MongoDB connection string for your local ledger node.
```

---

## 🐳 File 2: `docker-compose.yml`
*Save this file to your project root to govern container runtime execution.*

```yaml
# docker-compose.yml — SoloHost Runtime Compose Manifest
services:
  web:
    image: docker.io/pinoyq8/bazaar-republic-alpha:latest
    pull_policy: always
    restart: unless-stopped
    ports:
      - '3000:3000'
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${MONGODB_URI}
      - MONGODB_URI=${MONGODB_URI}
      - NEXT_PUBLIC_PI_SANDBOX=true
      - NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID=CDI5EAXHES3KPZBLAICUWUSDCLFGTN3MDURTFMQCXTQWFSYRK357YPD6
      - NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
      - NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/api/health || exit 1"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 20s
```

---

## 🐧 File 3: `solohost_preflight_check.sh`
*Bash pre-flight evaluator for Linux/macOS node hosts.*

```bash
#!/usr/bin/env bash
# solohost_preflight_check.sh — Pre-flight system resources evaluator

echo "=== SoloHost Hardware & Runtime Pre-Flight Audit ==="

# 1. CPU Core Count
CPU_CORES=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 1)
echo "[1/4] CPU Cores Detected: $CPU_CORES"
if [ "$CPU_CORES" -lt 4 ]; then
    echo "  ⚠️ WARNING: SoloHost v2 recommends >= 4 CPU cores."
else
    echo "  ✅ CPU Cores: PASS"
fi

# 2. Total RAM Check
MEM_KB=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}')
if [ -n "$MEM_KB" ]; then
    MEM_GB=$((MEM_KB / 1024 / 1024))
    echo "[2/4] Total System RAM: ${MEM_GB}GB"
    if [ "$MEM_GB" -lt 8 ]; then
        echo "  ⚠️ WARNING: SoloHost v2 recommends >= 8GB RAM."
    else
        echo "  ✅ Memory: PASS"
    fi
else
    echo "[2/4] Total System RAM: Check skipped (non-Linux platform)."
fi

# 3. Docker Daemon Availability
echo "[3/4] Checking Docker Engine..."
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        echo "  ✅ Docker Daemon is active and responsive."
    else
        echo "  ❌ ERROR: Docker installed but daemon is not running!"
    fi
else
    echo "  ❌ ERROR: Docker CLI not found."
fi

# 4. Port Availability (3000)
echo "[4/4] Checking Port 3000 availability..."
if command -v nc &> /dev/null; then
    if nc -z 127.0.0.1 3000 2>/dev/null; then
        echo "  ⚠️ WARNING: Port 3000 is currently in use."
    else
        echo "  ✅ Port 3000 is open and ready for binding."
    fi
fi

echo "=== Pre-flight Audit Complete ==="
```

---

## 💻 File 4: `solohost_dx.ps1`
*PowerShell pre-flight evaluator for Windows node workstations.*

```powershell
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
```

---

## 🐍 File 5: `pi_payment_verifier.py`
*Python 3.12 Server-to-Server (S2S) Payment Verifier.*

```python
import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger("PiNetworkVerifier")

class PiAPIError(Exception):
    def __init__(self, status_code: int, error_message: str, response_body: Optional[str] = None):
        super().__init__(f"Pi API Error {status_code}: {error_message}")
        self.status_code = status_code
        self.error_message = error_message
        self.response_body = response_body

class PiNetworkVerifier:
    def __init__(self, api_key: str, base_url: str = "https://api.minepi.com"):
        if not api_key:
            raise ValueError("Developer API Key is mandatory.")
        self.api_key = api_key.strip()
        self.base_url = base_url.strip().rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Key {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Pi-Python-Community-SDK/1.0.0"
        })

    def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {access_token.strip()}"}
        res = self.session.get(f"{self.base_url}/v2/me", headers=headers, timeout=10)
        return self._parse_response(res)

    def get_payment(self, payment_id: str) -> Dict[str, Any]:
        res = self.session.get(f"{self.base_url}/v2/payments/{payment_id.strip()}", timeout=10)
        return self._parse_response(res)

    def approve_payment(self, payment_id: str) -> Dict[str, Any]:
        res = self.session.post(f"{self.base_url}/v2/payments/{payment_id.strip()}/approve", json={}, timeout=10)
        return self._parse_response(res)

    def complete_payment(self, payment_id: str, txid: str) -> Dict[str, Any]:
        res = self.session.post(f"{self.base_url}/v2/payments/{payment_id.strip()}/complete", json={"txid": txid.strip()}, timeout=10)
        return self._parse_response(res)

    def _parse_response(self, response: requests.Response) -> Dict[str, Any]:
        if "application/json" not in response.headers.get("Content-Type", ""):
            raise PiAPIError(response.status_code, "Non-JSON response received", response.text)
        data = response.json()
        if not response.ok:
            raise PiAPIError(response.status_code, data.get("error", "API error"), response.text)
        return data
```

---

## 🐘 File 6: `PiPaymentVerifier.php`
*PHP 8.x Server-to-Server (S2S) Payment Verifier.*

```php
<?php
namespace PiNetwork;

class PiAPIException extends \Exception {
    private int $statusCode;
    private ?string $responseBody;

    public function __construct(int $statusCode, string $errorMessage, ?string $responseBody = null) {
        parent::__construct("Pi API Error {$statusCode}: {$errorMessage}", $statusCode);
        $this->statusCode = $statusCode;
        $this->responseBody = $responseBody;
    }
    public function getStatusCode(): int { return $this->statusCode; }
    public function getResponseBody(): ?string { return $this->responseBody; }
}

class PiPaymentVerifier {
    private string $apiKey;
    private string $baseUrl;

    public function __construct(string $apiKey, string $baseUrl = "https://api.minepi.com") {
        if (empty(trim($apiKey))) {
            throw new \InvalidArgumentException("Developer API Key is required.");
        }
        $this->apiKey = trim($apiKey);
        $this->baseUrl = rtrim(trim($baseUrl), '/');
    }

    public function getUserProfile(string $accessToken): array {
        return $this->executeRequest("{$this->baseUrl}/v2/me", 'GET', null, ["Authorization: Bearer {$accessToken}"]);
    }

    public function getPayment(string $paymentId): array {
        return $this->executeRequest("{$this->baseUrl}/v2/payments/{$paymentId}");
    }

    public function approvePayment(string $paymentId): array {
        return $this->executeRequest("{$this->baseUrl}/v2/payments/{$paymentId}/approve", 'POST', []);
    }

    public function completePayment(string $paymentId, string $txid): array {
        return $this->executeRequest("{$this->baseUrl}/v2/payments/{$paymentId}/complete", 'POST', ['txid' => $txid]);
    }

    private function executeRequest(string $url, string $method = 'GET', ?array $payload = null, array $additionalHeaders = []): array {
        $ch = curl_init();
        $headers = array_merge([
            "Authorization: Key " . $this->apiKey,
            "Content-Type: application/json",
            "User-Agent: Pi-PHP-Community-SDK/1.0.0"
        ], $additionalHeaders);

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($payload !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            }
        }

        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($response, true);
        if ($statusCode >= 400 || !$data) {
            throw new PiAPIException($statusCode, $data['error'] ?? 'API error', $response);
        }
        return $data;
    }
}
```
