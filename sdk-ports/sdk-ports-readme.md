# 🛠️ Bazaar Republic: Pi Network Community SDK Ports
File Location: `/sdk-ports/`  
License: MIT / PiOS Community Contribution [cite: 6]

This directory houses the official community-driven ports of the Pi Network Server-to-Server (S2S) SDK for both **Python (3.12+)** and **PHP (8.x+)** [cite: 6]. These ports are architected to align with the core security and transaction paradigms of the Bazaar Republic [cite: 74], enabling developers to verify user sessions, secure U2A payment lifecycles, and isolate execution environments cleanly from the Next.js runtime [cite: 12, 105, 106].

---

## 📂 Directory Layout

To maintain strict separation of concerns and prevent hot-reloading overhead or linter confusion inside VS Code [cite: 12, 165], these ports are structured as follows:

```text
sdk-ports/
├── python/                     # 🐍 Python Community SDK Port
│   ├── pi_payment_verifier.py  # Production S2S API Client logic
│   ├── requirements.txt        # Virtual environment dependencies
│   └── test_verifier.py        # 6-Assertion isolated unit test suite
│
└── php/                        # 🐘 PHP Community SDK Port
    ├── PiPaymentVerifier.php   # Production S2S API Client logic
    └── test_verifier.php       # 15-Assertion namespace-mocked test suite
```

---

## 🐍 Python SDK Port (v1.0.0)

The Python implementation maps the official `pi-nodejs` SDK patterns into native, type-safe Python 3.12, utilizing connection pooling via the standard `requests` library [cite: 6, 34, 35].

### 🚀 Local Quickstart & Installation

Navigate to your Python directory, spin up a secure virtual environment, and install the verified packages [cite: 34, 115]:

```powershell
# 1. Navigate to the Python directory
cd sdk-ports/python

# 2. Initialize a local virtual environment (.venv)
python -m venv .venv

# 3. Activate the environment (PowerShell)
.venv\Scripts\Activate.ps1
# On Linux/macOS: source .venv/bin/activate

# 4. Install all dependencies and formatting engines
pip install -r requirements.txt
```

### 🧪 Executing Unit Tests

The test suite is fully isolated and asserts mock API behaviors offline [cite: 34]:

```powershell
python -m unittest test_verifier.py
```

---

## 🐘 PHP SDK Port (v1.0.0)

The PHP implementation leverages native PHP 8.x typed properties and standard cURL handles [cite: 83]. It is built with zero external framework dependencies [cite: 82].

### ⚙️ Prerequisites (Windows Workstations)

PHP requires cURL and OpenSSL enabled to perform secure HTTPS handshakes against the Pi validators [cite: 83, 106]. Ensure the following are active in your `php.ini` file [cite: 83]:

```ini
extension_dir = "ext"
extension=curl
extension=openssl
```

### 🚀 Running the Linter/Syntax Check

Verify lexical compilation integrity [cite: 115]:

```powershell
php -l PiPaymentVerifier.php
```

### 🧪 Executing Namespace-Mocked Tests

The PHP test suite utilizes a advanced **Namespace Overriding** pattern to intercept curl calls natively without heavy PHPUnit mocking frames [cite: 82]:

```powershell
php test_verifier.php
```

---

## 🛡️ Core SDK Architectural Alignments

Both ports implement three critical security and resilience features mandated by the Bazaar Republic specifications:

### 1. HTML Gateway Defenses (The Crash Guard)
Both wrappers intercept and analyze HTTP `Content-Type` headers before passing responses to a JSON decoder [cite: 35, 82]. If an API gateway returns an HTML error page (e.g., `502 Bad Gateway` during a timeout), the SDK halts execution gracefully, logs a safe text excerpt, and throws a structured error (`PiAPIError` / `PiAPIException`) [cite: 35, 78, 82]. This prevents the standard backend JSON decoder from throwing an unhandled exception and crashing the runtime [cite: 35, 82].

### 2. User-to-App (U2A) Lifecycle Handshakes
Includes step-by-step implementations to manage on-chain payment logic securely [cite: 75, 105]:
*   **User Profile Retrieval:** Performs secure `Bearer` auth handshakes to extract a user's verified UID, username, and roles from `GET /v2/me` [cite: 106].
*   **Get Payment:** Resolves transaction structures to verify values, memos, and developers [cite: 105].
*   **Approve Payment:** Instructs Pi nodes to queue a pending invoice for blockchain settlement [cite: 105].
*   **Complete Payment:** Sends final confirmation containing the settled blockchain ledger transaction ID (`txid`) [cite: 105].

### 3. Isolated Development Environments
By separating these files from your Next.js `/app` root, VS Code isolates code analysis [cite: 12, 165]. TypeScript lint engines only process Javascript directories [cite: 12, 165], and Python interpreters remain bound strictly to their local `.venv` environments [cite: 34], preserving workspace responsiveness and build performance [cite: 165].
