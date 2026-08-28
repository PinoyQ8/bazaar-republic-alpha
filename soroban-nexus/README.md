# 🚀 Soroban Nexus: Protocol 28 Escrow Vault & State TTL Keeper

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Rust](https://img.shields.io/badge/Rust-1.78%2B-orange.svg)](https://www.rust-lang.org/)
[![Soroban SDK](https://img.shields.io/badge/Soroban_SDK-v22.0.0-cyan.svg)](https://soroban.stellar.org/)
[![Stellar Protocol](https://img.shields.io/badge/Stellar-Protocol_28_Compliant-purple.svg)](https://stellar.org/)
[![CI Status](https://img.shields.io/badge/CI-wasm32v1--none_Passing-emerald.svg)](.github/workflows/ci.yml)

**Soroban Nexus** is a standalone, production-ready, open-source Developer Kit designed for the **Stellar Community Fund (SCF v7.0)**. It provides a complete reference architecture for executing high-security timelocked escrow agreements and automated on-chain state Time-To-Live (TTL) auto-management under modern **Stellar Protocol 28 ("Adapter")** standards.

This kit decouples the on-chain smart contract layer and background utility daemons from proprietary application-specific code, delivering an essential ecosystem public good that solves modern state-archiving rent penalties and cryptographic race conditions.

---

## 🏗️ Repository Architecture

```text
soroban-nexus/
├── .github/
│   └── workflows/
│       └── ci.yml             # Automated wasm32v1-none CI compilation & 6-test verification
├── contracts/
│   └── bazaar-vault/
│       ├── src/
│       │   └── lib.rs         # Protocol 28 Persistent Escrow Vault Smart Contract
│       └── Cargo.toml         # Contract Manifest (SDK v22, cdylib + rlib)
├── scripts/
│   └── ttl-keeper.ts          # TypeScript State TTL Monitoring & Auto-Extension Daemon
├── Cargo.toml                 # Workspace Root Manifest (Resolver v2)
├── LICENSE                    # MIT License Permissive Terms
└── README.md                  # Developer Documentation
```

---

## 🏛️ 1. Smart Contract Design (`bazaar-vault`)

The core contract (`contracts/bazaar-vault/src/lib.rs`) implements a highly secure, non-custodial, and state-efficient multi-record escrow framework.

### 🔒 Persistent Storage & Multi-Record Isolation
To prevent shared storage bottlenecks and mitigate transaction collisions, the vault utilizes **Persistent Storage Keys** mapped to unique transaction symbols (`Symbol` escrow IDs). 

```rust
// Persistent storage with TTL extension for multi-record isolation
env.storage().persistent().set(&escrow_id, &record);
env.storage().persistent().extend_ttl(&escrow_id, 100000, 100000);
```

### ⚡ Protocol 28 State Lease Management
Unlike ephemeral data storage, persistent ledger entries require explicit rent management. The contract programmatically extends the Time-to-Live (TTL) of each escrow state to **100,000 ledgers** on every state transition (`lock_funds`, `release`, `refund`), protecting active vaults from falling into cold archived states.

---

## 🤖 2. Dynamic State TTL Keeper Daemon (`ttl-keeper.ts`)

To complement the on-chain contract, the repository includes **`ttl-keeper.ts`**, a background TypeScript monitoring agent powered by `@stellar/stellar-sdk`.

### 📊 Automated Monitoring & Fee Optimization
The daemon runs as a continuous, lightweight service that:
1. Queries the latest ledger sequence from the Soroban RPC provider.
2. Extracts the contract instance's active ledger entries.
3. Computes the current remaining TTL (`liveUntilLedgerSeq - latestLedger`).
4. If remaining TTL falls below the **5,000 ledger safety threshold**, it automatically constructs, simulates, assembles fees for, and broadcasts an on-chain `extendFootprintTtl` transaction up to the **100,000 lifetime cap**.

This automated background maintenance completely eliminates manual, high-cost operator intervention while guaranteeing uninterrupted state accessibility.

---

## 🛡️ 3. Comprehensive Unit Testing (6-for-6 passing)

Our codebase is verified by an extensive, high-coverage unit testing suite that simulates real ledger states, elapsed times, and cryptographic signatures within the virtual Soroban host environment.

Run the test suite locally:
```powershell
cargo test
```

### 🧪 Test Suite Coverage & Core Verifications:

| # | Test Name | Target Metric | Assertion Behavior | Status |
|---|---|---|---|---|
| **1** | `test_vault_escrow_lifecycle` | Standard Operations | Verifies flawless execution of `lock_funds` ➔ `get_vault` query ➔ `release_funds` path. | **PASS** |
| **2** | `test_vault_refund_success` | Temporal Safety | Advances the simulated ledger timestamp past the timelock window and verifies successful contract state transition to `Refunded`. | **PASS** |
| **3** | `test_vault_refund_fails_early` | Security Boundaries | **[Should Panic]** Attempts a refund prior to timelock expiration; asserts that the contract panics with `ERR_TIMELOCK_NOT_EXPIRED`. | **PASS** |
| **4** | `test_vault_lock_fails_on_overwrite` | Collision Prevention | **[Should Panic]** Attempts to lock funds into an already existing `escrow_id`; asserts that the contract halts execution to prevent malicious state overwrite. | **PASS** |
| **5** | `test_vault_release_fails_unauthorized_caller` | Access Control | **[Should Panic]** Attempts to call `release_funds` from a non-consumer identity; asserts that identity authentication boundaries are securely enforced. | **PASS** |
| **6** | `test_vault_dispute_success` | Governance Support | Simulates escrow escalation to a frozen `Disputed` status, waiting for external arbitrator resolution. | **PASS** |

---

## 📦 4. Getting Started: Quickstart

### Prerequisites
* **Rust Toolchain**: `v1.84.0+` (Required for the `wasm32v1-none` compiler target)
* **Node.js**: `v18.0.0+` (Required for running the TypeScript Keeper daemon)
* **Stellar CLI**: `v22.0.0`

### 1. Build Smart Contracts
Compile your contract into optimized, on-chain WebAssembly bytecode. 

*Note: On Rust 1.82+, compiling to the legacy `wasm32-unknown-unknown` target is deprecated as it generates unsupported WebAssembly instructions. This contract compiles flawlessly using the modern, official target:*

```powershell
cargo build --target wasm32v1-none --release
```

The optimized contract binary will be generated at:
`./target/wasm32v1-none/release/bazaar_vault.wasm`

### 2. Deploy to Stellar Testnet
```powershell
stellar contract deploy \
  --wasm ./target/wasm32v1-none/release/bazaar_vault.wasm \
  --source YOUR_ACCOUNT_SECRET \
  --network testnet
```

### 3. Run the Unit Test Suite
```powershell
cargo test --workspace
```

### 4. Configure & Start the TTL Keeper Daemon
Navigate to the root directory, install dependencies, configure your variables, and launch the daemon:

```powershell
# Install Node dependencies
npm install dotenv @stellar/stellar-sdk

# Configure environment variables
Set-Content -Path .env.local -Value "SOROBAN_RPC_URL=https://soroban-testnet.stellar.org`nNEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID=YOUR_DEPLOYED_CONTRACT_ID`nKEEPER_SIGNER_SECRET=YOUR_OPERATOR_SECRET_KEY"

# Start the monitoring daemon
npx tsx scripts/ttl-keeper.ts
```

---

## 🛠️ 5. Automated CI/CD (GitHub Actions Integration)

This repository includes a continuous integration pipeline (`.github/workflows/ci.yml`) to ensure every commit is completely stable:
* Spins up an `ubuntu-latest` virtual runner on every push or pull request to the `main` branch.
* Installs the stable Rust toolchain and explicitly registers the **`wasm32v1-none`** target.
* Evaluates transitive dependency overrides to lock `ed25519-dalek` to the correct stable **`v2.1.0`** standard, resolving trait-bound compilation errors.
* Compiles your contract and verifies that all **6 unit tests** pass perfectly.

---

## ⚖️ License & Open-Source Commitment

To support developer adoption and maximize positive impact on the Stellar and Soroban ecosystems, the **Soroban Nexus Developer Kit** is dual-licensed and released under the permissive **MIT License**.

***
*© 2026 Project Bazaar. All rights reserved. Open-source under the MIT Agreement.*
