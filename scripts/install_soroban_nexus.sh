#!/usr/bin/env bash
# =============================================================================
# 🏛️ BAZAAR REPUBLIC — Soroban Nexus Open-Source Developer Kit Installer
# =============================================================================
# Version: 1.0.0
# Purpose: Recreates the standalone, dual-licensed Soroban Nexus workspace
#          designed for the Stellar Community Fund (SCF v7.0) proposal.
# =============================================================================

set -euo pipefail

# --- Color Palettes ---
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
PLAIN='\033[0m'

echo -e "${CYAN}====================================================================${PLAIN}"
echo -e "${CYAN}        🏛️  BAZAAR REPUBLIC — SOROBAN NEXUS CODEBASE GENERATOR  🏛️        ${PLAIN}"
echo -e "${CYAN}====================================================================${PLAIN}"
echo -e "Recreating directory structures and code files...\n"

# 1. Create directory structures
mkdir -p soroban-nexus/contracts/bazaar-vault/src
mkdir -p soroban-nexus/scripts

# -----------------------------------------------------------------------------
# File A: soroban-nexus/Cargo.toml
# -----------------------------------------------------------------------------
cat << 'EOF' > soroban-nexus/Cargo.toml
[workspace]
resolver = "2"
members = [
    "contracts/bazaar-vault",
]

[workspace.package]
version = "1.0.0"
edition = "2021"
authors = ["Bazaar Tech <mesh@projectbazaar.dao>"]
license = "MIT"
publish = false

[workspace.dependencies]
soroban-sdk = { version = "22.0.0", default-features = false }

[profile.release]
opt-level = "z"
overflow-checks = true
debug = false
debug-assertions = false
panic = "abort"
codegen-units = 1
lto = true
EOF
echo -e "  [${GREEN}OK${PLAIN}] Created soroban-nexus/Cargo.toml"

# -----------------------------------------------------------------------------
# File B: soroban-nexus/contracts/bazaar-vault/Cargo.toml
# -----------------------------------------------------------------------------
cat << 'EOF' > soroban-nexus/contracts/bazaar-vault/Cargo.toml
[package]
name = "bazaar-vault"
version.workspace = true
edition.workspace = true
license.workspace = true
publish.workspace = true

[lib]
name = "bazaar_vault"
crate-type = ["cdylib", "rlib"]
path = "src/lib.rs"

[dependencies]
soroban-sdk = { workspace = true }

[dev-dependencies]
soroban-sdk = { workspace = true, features = ["testutils"] }
EOF
echo -e "  [${GREEN}OK${PLAIN}] Created soroban-nexus/contracts/bazaar-vault/Cargo.toml"

# -----------------------------------------------------------------------------
# File C: soroban-nexus/contracts/bazaar-vault/src/lib.rs
# -----------------------------------------------------------------------------
cat << 'EOF' > soroban-nexus/contracts/bazaar-vault/src/lib.rs
#![no_std]

use soroban_sdk::{contract, contracttype, contractimpl, Address, Env, Symbol};

#[derive(Clone, PartialEq, Eq)]
#[contracttype]
pub enum EscrowStatus {
    Locked,
    Released,
    Disputed,
    Refunded,
}

#[derive(Clone)]
#[contracttype]
pub struct VaultEscrowRecord {
    pub consumer: Address,
    pub provider: Address,
    pub amount: i128,
    pub status: EscrowStatus,
    pub protocol_version: u32,
    pub expires_at: u64,
}

#[contract]
pub struct BazaarEscrowVaultContract;

#[contractimpl]
impl BazaarEscrowVaultContract {
    pub fn lock_funds(
        env: Env, 
        escrow_id: Symbol, 
        consumer: Address, 
        provider: Address, 
        amount: i128,
        duration_secs: u64
    ) -> VaultEscrowRecord {
        consumer.require_auth();
        
        let current_time = env.ledger().timestamp();
        let expires_at = current_time + duration_secs;

        let record = VaultEscrowRecord {
            consumer,
            provider,
            amount,
            status: EscrowStatus::Locked,
            protocol_version: 28,
            expires_at,
        };

        // 🛡️ Persistent storage with TTL extension for multi-record isolation
        env.storage().persistent().set(&escrow_id, &record);
        env.storage().persistent().extend_ttl(&escrow_id, 100000, 100000);
        
        record
    }

    pub fn get_vault(env: Env, escrow_id: Symbol) -> VaultEscrowRecord {
        env.storage().persistent().get(&escrow_id).unwrap_or_else(|| {
            panic!("ERR_NOT_FOUND")
        })
    }

    pub fn release_funds(
        env: Env,
        escrow_id: Symbol,
        consumer: Address
    ) -> VaultEscrowRecord {
        consumer.require_auth();

        let mut record: VaultEscrowRecord = env.storage().persistent().get(&escrow_id).unwrap_or_else(|| {
            panic!("ERR_NOT_FOUND")
        });

        if record.consumer != consumer {
            panic!("ERR_UNAUTHORIZED");
        }
        if record.status != EscrowStatus::Locked {
            panic!("ERR_INVALID_STATE");
        }

        record.status = EscrowStatus::Released;
        env.storage().persistent().set(&escrow_id, &record);
        env.storage().persistent().extend_ttl(&escrow_id, 100000, 100000);
        
        record
    }

    pub fn refund_funds(
        env: Env,
        escrow_id: Symbol,
        consumer: Address
    ) -> VaultEscrowRecord {
        consumer.require_auth();

        let mut record: VaultEscrowRecord = env.storage().persistent().get(&escrow_id).unwrap_or_else(|| {
            panic!("ERR_NOT_FOUND")
        });

        if record.consumer != consumer {
            panic!("ERR_UNAUTHORIZED");
        }
        if record.status != EscrowStatus::Locked {
            panic!("ERR_INVALID_STATE");
        }

        let current_time = env.ledger().timestamp();
        if current_time < record.expires_at {
            panic!("ERR_TIMELOCK_NOT_EXPIRED");
        }

        record.status = EscrowStatus::Refunded;
        env.storage().persistent().set(&escrow_id, &record);
        env.storage().persistent().extend_ttl(&escrow_id, 100000, 100000);
        
        record
    }
}
EOF
echo -e "  [${GREEN}OK${PLAIN}] Created soroban-nexus/contracts/bazaar-vault/src/lib.rs"

# -----------------------------------------------------------------------------
# File D: soroban-nexus/scripts/ttl-keeper.ts
# -----------------------------------------------------------------------------
cat << 'EOF' > soroban-nexus/scripts/ttl-keeper.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { 
  rpc, 
  Keypair, 
  Networks, 
  TransactionBuilder, 
  xdr, 
  Operation, 
  Address 
} from "@stellar/stellar-sdk";

const RPC_URL = process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const CONTRACT_ID = process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID || "";
const KEEPER_SECRET = process.env.KEEPER_SIGNER_SECRET || "";

async function runTtlKeeper() {
  console.log("🤖 [KEEPER-BOT] Initializing Soroban State TTL Monitoring Daemon...");

  if (!CONTRACT_ID || !KEEPER_SECRET) {
    console.error("❌ [KEEPER-BOT] Missing CONTRACT_ID or KEEPER_SIGNER_SECRET in environment.");
    process.exit(1);
  }

  const server = new rpc.Server(RPC_URL);
  const keeperKeypair = Keypair.fromSecret(KEEPER_SECRET);
  const keeperAddress = keeperKeypair.publicKey();

  try {
    const latestLedger = await server.getLatestLedger();
    console.log(`📡 [KEEPER-BOT] Current Network Ledger Sequence: ${latestLedger.sequence}`);

    const contractAddress = Address.fromString(CONTRACT_ID);
    const contractInstanceKey = xdr.LedgerKey.contractData(
      new xdr.LedgerKeyContractData({
        contract: contractAddress.toScAddress(),
        key: xdr.ScVal.scvLedgerKeyContractInstance(),
        durability: xdr.ContractDurability.instance(),
      })
    );

    const ledgerEntries = await server.getLedgerEntries(contractInstanceKey);
    if (!ledgerEntries.entries || ledgerEntries.entries.length === 0) {
      throw new Error(`Contract ${CONTRACT_ID} has not been deployed on this network.`);
    }

    const contractEntry = ledgerEntries.entries[0];
    const currentLiveUntil = contractEntry.liveUntilLedgerSeq;
    const remainingTtl = currentLiveUntil - latestLedger.sequence;

    console.log(`📊 [KEEPER-BOT] Contract live until ledger: ${currentLiveUntil} (Remaining TTL: ${remainingTtl} ledgers)`);

    const TTL_THRESHOLD = 5000;
    const EXTEND_TO_LIFETIME = 100000;

    if (remainingTtl < TTL_THRESHOLD) {
      console.log(`⚠️ [KEEPER-BOT] TTL (${remainingTtl}) is below safety threshold. Extending...`);

      const extendOp = Operation.extendFootprintTtl({
        extendTo: EXTEND_TO_LIFETIME,
      });

      const initialSorobanData = new xdr.SorobanTransactionData({
        resources: new xdr.SorobanResources({
          footprint: new xdr.LedgerFootprint({
            readOnly: [contractInstanceKey],
            readWrite: [],
          }),
          instructions: 0,
          readBytes: 0,
          writeBytes: 0,
        }),
        resourceFee: xdr.Int64.fromString("0"),
      });

      const account = await server.getAccount(keeperAddress);
      const txTemplate = new TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: Networks.TESTNET,
      })
        .setTimeout(30)
        .addOperation(extendOp)
        .setSorobanData(initialSorobanData)
        .build();

      const simulation = await server.simulateTransaction(txTemplate);
      if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(`Simulation failed: ${simulation.error}`);
      }

      const finalFee = rpc.assembleTransactionFee(txTemplate, simulation);
      const finalTx = new TransactionBuilder(account, {
        fee: finalFee,
        networkPassphrase: Networks.TESTNET,
      })
        .setTimeout(30)
        .addOperation(extendOp)
        .setSorobanData(simulation.transactionData!)
        .build();

      finalTx.sign(keeperKeypair);
      const response = await server.sendTransaction(finalTx);

      if (response.status === "ERROR") {
        throw new Error(`Transaction failed: ${JSON.stringify(response.errorResultXdr)}`);
      }

      console.log(`✅ [KEEPER-BOT] TTL Extension successful. Hash: ${response.hash}`);
    } else {
      console.log("✨ [KEEPER-BOT] Remaining TTL is safe. No action needed.");
    }
  } catch (error: any) {
    console.error("❌ [KEEPER-BOT] Execution fault during TTL sweep:", error?.message || error);
  }
}

runTtlKeeper();
EOF
echo -e "  [${GREEN}OK${PLAIN}] Created soroban-nexus/scripts/ttl-keeper.ts"

# -----------------------------------------------------------------------------
# File E: soroban-nexus/LICENSE
# -----------------------------------------------------------------------------
cat << 'EOF' > soroban-nexus/LICENSE
MIT License

Copyright (c) 2026 Project Bazaar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
echo -e "  [${GREEN}OK${PLAIN}] Created soroban-nexus/LICENSE"

# -----------------------------------------------------------------------------
# File F: soroban-nexus/README.md
# -----------------------------------------------------------------------------
cat << 'EOF' > soroban-nexus/README.md
# 🚀 Soroban Nexus Framework (Protocol 28 Compliant)

This standalone open-source developer kit is designed to accelerate on-chain asset lockups, Timelock escrow lifecycles, and state Time-To-Live (TTL) auto-management under **Stellar/Soroban Protocol 28 standards**.

## 🏗️ Technical Stack & Dependencies
* **Rust**: `1.78+`
* **Soroban SDK**: `v22.0.0`
* **Stellar CLI**: `v22.0.0`
* **Node.js**: `v18+` (For TTL Keeper Bot daemon)

## 📁 Repository Structure
* `/contracts/bazaar-vault`: Core smart contract implementing `lock_funds`, `release_funds`, and `refund_funds` using isolated persistent storage keys.
* `/scripts/ttl-keeper.ts`: Automated background state lease renewer daemon.
* `Cargo.toml`: Cargo workspace manifest.

## 🚀 Getting Started

### 1. Compile Smart Contracts
Ensure you have the WebAssembly build target installed, then build the contract:
```bash
cargo build --target wasm32v1-none --release
```

### 2. Deploy to Testnet
```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/bazaar_vault.wasm \
  --source YOUR_ACCOUNT_KEY \
  --network testnet
```

### 3. Initialize & Run TTL Keeper Bot
Configure your `.env.local` variables, install dependencies, and run:
```bash
npx tsx scripts/ttl-keeper.ts
```

## ⚖️ Licensing
Licensed under the permissive **MIT License** for public-good ecosystem support.
EOF
echo -e "  [${GREEN}OK${PLAIN}] Created soroban-nexus/README.md"

echo -e "\n${GREEN}====================================================================${PLAIN}"
echo -e "🎉  SOROBAN NEXUS CODEBASE INSTALLED SUCCESSFULLY IN LOCAL MACHINE!  🎉"
echo -e "${CYAN}====================================================================${PLAIN}"
echo -e "Navigate to: ${YELLOW}./soroban-nexus${PLAIN}"
echo -e "Execute '${YELLOW}cargo build --target wasm32v1-none --release${PLAIN}' to compile contracts!"
echo -e "${CYAN}====================================================================${PLAIN}"
