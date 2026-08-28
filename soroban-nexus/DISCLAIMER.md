# ⚖️ LEGAL DISCLAIMER & LICENSING SEPARATION AGREEMENT
## Project Bazaar (Open-Source Developer Kit) vs. Bazaar Republic (Proprietary Application Layer)
**Date of Issuance:** August 23, 2026  
**Applicability:** This Disclaimer is a legally binding annex to the `LICENSE` file within this repository (`soroban-nexus`).

---

### ⚠️ IMPORTANT NOTICE TO ALL DEVELOPERS, USERS, AND AUDITORS

This repository, **Project Bazaar: Soroban Nexus (v1.0.0)**, is published and maintained as a public-good developer toolkit for the Stellar and Soroban ecosystems under the terms of the permissive **MIT License**. 

By downloading, cloning, compiling, or interacting with any file, smart contract, script, or asset in this repository, you acknowledge and agree to the strict legal and intellectual property boundaries defined herein. If you do not agree to these terms, you must immediately delete all local copies of this codebase.

---

### 🛡️ 1. Strict Separation of Intellectual Property

#### A. The MIT Licensed Boundary (Project Bazaar - This Repository)
The permissive **MIT License** applies **ONLY** to the specific structural source files contained within the boundaries of this `soroban-nexus` repository directory, specifically:
*   The `Cargo.toml` workspace manifest.
*   The Soroban persistent escrow vault smart contract located at `/contracts/bazaar-vault/src/lib.rs`.
*   The background TypeScript Time-To-Live (TTL) daemon located at `/scripts/ttl-keeper.ts`.
*   Automated CI/CD workflows and local setup/installer helper scripts.

These components are open-source and freely distributable, provided the original copyright notice (`Copyright (c) 2026 Project Bazaar`) is retained in all downstream derivatives.

#### B. The Protected Proprietary Boundary (Bazaar Republic - Exempt Assets)
The permissive licensing of this developer toolkit does **NOT** grant, imply, or transfer any rights, licenses, or permissions to the core commercial marketplace assets, proprietary codebases, or branding belonging to the **Bazaar Republic** (codified under the proprietary `bazaar-republic-alpha` code tree). 

The following assets are **STRICTLY EXCLUDED** from the MIT License and are protected under the **Pi Open Source (PiOS) License Agreement**, or reserved exclusively under copyright:
1.  **Marketplace Codebase:** The Next.js frontend clients, TypeScript backend state engines, API routes, and database schema controllers (`bzr-db` powered by Prisma and MongoDB).
2.  **Trademarks & Brand Identity:** The names *"Bazaar Republic"*, *"The MESH Protocol"*, and all associated graphical logos (including `bazaar-logo.png` and `bazaar_app_logo.jpg`), banners, and promotional illustrations.
3.  **Governance Models:** The proprietary 5-Tier Passport voting schemas, double-gated 80% consensus structures, and Founder Soft-Veto programmatic gating mechanisms.
4.  **Economic Infrastructure:** The AMM liquidity split matrices (70% Node / 30% POL), and the Tri-Factor Purchasing Power Parity (PPP) rate-pricing oracle contracts.

These excluded assets are legally restricted to deploy and run **natively and exclusively** inside the enclosed **Pi Network utility sandbox and Pi Browser ecosystem**. They may not be extracted, compiled, or deployed on any external public blockchain or speculative marketplace.

---

### 🚨 2. Non-Speculative Utility & Compliance Guarantee

#### A. Sandbox Isolation
The smart contracts and scripts in this repository are designed to demonstrate technical compliance under **Stellar/Soroban Protocol 28 ("Adapter")** standards. During the current active deployment phases, all smart contract interactions are strictly locked to the **Stellar Testnet** using Friendbot-funded play assets.
*   These assets have **zero real-world monetary value**.
*   This repository does not facilitate, support, or permit speculative trading, L1/L2 liquidity pools on active mainnets, or secondary market asset distributions.

#### B. Regulatory Gating & KYC Compliance
In direct alignment with the Pi Core Team's non-speculative, utility-driven guidelines for Enclosed Mainnet operations:
*   All tokenomic conversions ($mBZR utility fuel back to native L1 Pi collateral vaults) and on-chain governance voting actions require a verified, active, cryptographically signed upgrade path mapped to an officially approved **Pi Network KYC passport**.
*   Unverified or non-KYC'ed participants are strictly barred from execute-level contract interactions, ensuring absolute resistance against automated Sybil bot networks.

---

### ⚖️ 3. No Warranty & Limitation of Liability

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 

IN NO EVENT SHALL THE COPYRIGHT HOLDER, PROJECT BAZAAR, THE BAZAAR ACADEMY GOVERNANCE COUNCIL, OR BAZAAR REPUBLIC OPERATORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

---

### 📜 Certification & Execution
This legal annex is permanently committed to the repository root of `soroban-nexus` to guarantee that all downstream developers, institutional grant auditors (including the **Stellar Community Fund**), and core system curators have absolute clarity regarding the legal partition of our technical assets.

*In Code We Trust, In Law We Align.*  
**The Bazaar Academy Governance Council**  
*Project Bazaar Developer Taskforce*  
*Bazaar Republic Legal Counsel Coordination*
