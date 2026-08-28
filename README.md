🏛️ Project Bazaar Republic (Alpha)
--Image of: --PiOS License --Image of: --Framework --Image of: --Network --Image of: --Security

Project Bazaar is a decentralized autonomous merchant ecosystem (DAO) built natively on the Pi Network. Powered by The MESH Protocol, it provides zero-knowledge service attestations, passkey-secured merchant escrows, automated AMM swap liquidity, and 5-Elder Council dispute governance.

🏗️ System Architecture Overview
                  +-----------------------------------+
                  |      Pi Network Mainnet (L1)     |
                  +-----------------+-----------------+
                                    |
                    [ 1 PI : 1,000 mBZR Dynamic Peg ]
                                    |
                  +-----------------v-----------------+
                  |       The MESH Protocol (L2)      |
                  +--------+----------------+---------+
                           |                |
         +-----------------+                +-----------------+
         |                                                    |
+--------v-----------------------+            +---------------+----------------+
|     E-Network Merchant Escrow  |            |   AMM Swap Liquidity Engine    |
| - 48-Hour Auto-Release Timelock|            | - 0.3% Fee Matrix              |
| - Noir ZK Delivery Attestation |            |   ├── 70% Pioneer Node Yield   |
| - WebAuthn Passkey Release     |            |   └── 30% Treasury POL Buffer  |
+----------------+---------------+            +--------------------------------+
                 |
+----------------v---------------+
| Genesis 100 Elder Adjudication |
| - VRF-Selected 5-Elder Panel   |
| - 75% Winner / 25% Elder Split |
+--------------------------------+
⛽ 1. Reconciled L1/L2 Dual-Gas Economic Model (Model-3)
Project Bazaar implements the Model-3 Hybrid Dual-Token Gas Model to achieve high-velocity peer-to-peer micro-transactions while maintaining direct, fully compliant utility routing back to the native Pi Network Layer-1:

L1 Native Pi Fee Preservation: The native 0.01 Pi base network transaction fee is preserved and triggered only during direct Layer-1 ledger writes (e.g., locking collateral into our State Vault escrow contracts, deploying contract updates, or completing major App-to-User payouts).
L2 Micro-Fee Engine: High-frequency, off-chain commercial activities (storefront listings, escrow bonds, and AMM swaps) run on our L2 database layer (bzr-db) with a micro-fee structure (a 0.3% AMM swap fee).
The 70/30 Epoch Split: L2 micro-fees are distributed automatically by our epoch buffer: 70% to active DePIN node operators as hosting yield and 30% back to the Treasury Protocol-Owned Liquidity (POL) to secure the peg.
The Compression Relayer (bazaar_relayer.ts): To avoid network clogging and excessive transaction costs for users, our background relayer daemon groups thousands of off-chain L2 micro-transactions and posts them to settle permanently on the L1 Mainnet in a single batched ledger settlement, paying only a single 0.01 Pi native fee for the entire batch.
🪪 2. The 6-Tier Sovereign Passport System
Security and access clearances are governed by our decentralized identity system, mapping physical hardware authenticators directly to distinct cryptographic permission tiers:

👑 The Founder (Level-0 Admin): Retains master key administration, relayer daemon configuration, and emergency system pause actions (canUpgradeContracts, canBypassEscrowLocks).
🏛️ The Circle of Elders (Level-1 Arbitrators): A randomly selected panel of 5 validators chosen via a Verifiable Random Function (VRF) to adjudicate disputes within /mesh/escrow using cryptographic WebAuthn voting.
⚡ The Genesis 100 (Level-2 Pioneer Operators): The initial tier of 100 node runners hosting master database replicas, receiving weighted regional yields for early network support.
🛍️ The Merchant (Level-3 Commercial Drivers): Grants high-volume listing privileges on the E-Network, allowing vendors to integrate dynamic local fiat pricing with a 60-second rate-lock window via our pricing oracle (useLocalPricing.ts).
🖥️ The Node Operator (Level-4 DePIN Runners): standard hosting partners running our containerized docker setups, subject to the rolling 90% 30-Day SLA with a 10% (72-hour) maintenance allowance.
🌍 The Citizen (Level-5 Base Pioneers): Standard user class enabling instant, secure P2P micro-transactions, local biometric passport creation, and escrow capacities up to our individual 1,000 Pi lifetime cap.
🛡️ 3. Security Circles & Decentralized Social Recovery
To remove the barrier of complex seed phrases for mass audience onboarding, Project Bazaar integrates a hardware-backed social recovery model under Stellar Protocol 27 (CAP-0071) standards:

The 3-to-5 Trust Boundary: Every Citizen must establish a Security Circle containing at least 3 and at most 5 unique, trusted peer passports (validateSecurityCircle).
Biometric Passkey Recovery: If a user loses access to their secure enclave credentials, they can trigger a recovery event. Once a 3-out-of-5 threshold of cryptographically signed endorsements from their designated Security Circle is registered, the smart contract securely rotates the passport's public key.
Succession Veto Shield: Node operators can configure a dead-man's switch inactivity threshold. If triggered, their designated heir can claim node ownership. However, members of the operator's Security Circle retain a veto window, preventing wrongful takeovers during scheduled maintenance or temporary offline windows.
🖥️ 4. DePIN SoloHost v2 Node Specifications
Our decentralized hosting fleet is held to strict enterprise hardware standards to prevent Out-of-Memory (OOM) crashes and disk I/O bottlenecks:

Minimum Hardware Specification:
CPU: 4 physical cores minimum.
RAM: 8GB memory allocation.
Storage: SSD or NVMe (strictly disqualifying mechanical HDDs to handle continuous read/write state-sync throughput).
The 90% Rolling 30-Day SLA: Operators must maintain 90% active uptime over any rolling 30-day window (720 hours).
The 10% Maintenance Allowance: Operators are granted a 72-hour monthly buffer for routine software updates, operating system patches, and reboots, allowing them to service their hardware without impacting their TrustScores.
🏦 5. Soroban Protocol 28 "Melt & Vault" Contract Design
To protect the network from heavy state-rent penalties introduced under Protocol 28 upgrades, the bazaar_vault.rs smart contract replaces the traditional token burn models with a recirculating Melt & Vault treasury pattern:

When users melt L2 $mBZR back to L1 Pi, tokens are swept into a locked Treasury Vault rather than being destroyed.
When new users deposit Pi to mint $mBZR, tokens are released directly from this vault, avoiding expensive ledger deletion and re-creation actions.
This design slashes Soroban gas costs by 87.1%, dropping contract execution fees from 0.140 XLM down to 0.018 XLM equivalent on-chain.
📦 6. Getting Started: Developer & Node Deployment
Pre-Flight System Diagnostics
Before registering as a Node Operator or Genesis 100 runner, execute our cross-platform diagnostic script to verify your CPU, RAM, and SSD sequential write speeds:

Linux / macOS:

chmod +x solohost_dx.sh
./solohost_dx.sh
Windows (PowerShell):

Set-ExecutionPolicy Bypass -Scope Process
.\solohost_dx.ps1
Automated Next.js Local Testnet Installation
Deploy the complete local integration suite—including passport models, pricing hooks, and automated testing suites—in one command:

chmod +x install_testnet.sh
./install_testnet.sh
To run our Jest automated tests verifying permission guards, security circle thresholds, and oracle expirations:

npm run test:bazaar
# or
yarn test:bazaar
📜 PiOS License Certification
This repository is officially certified under the Pi Open Source (PiOS) License Agreement. The codebase is fully open-source for community audits, reviews, and node contributions. The repository is indexed and verified within the Pi Developer Portal (developer.pi).

© BAZAAR REPUBLIC. All rights reserved. Licensed under the Pi Open Source (PiOS) Agreement.