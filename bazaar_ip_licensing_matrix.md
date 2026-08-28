# 🏛️ Bazaar Republic & Project Bazaar: Intellectual Property & Dual-Licensing Matrix
**Version:** 1.0.0  
**Classification:** Technical Whitepaper Appendices / Audit Submittal Asset  
**Document Ref:** BZR-IP-LIC-2026-v1.0  
**Watermark:** © BAZAAR REPUBLIC | In code we trust  

---

### 1. Executive Summary: The Strategic IP Partition
To secure rapid ecosystem adoption, obtain global developer grants, and maintain absolute compliance with both the **Stellar Community Fund (SCF)** and the **Pi Core Team (PCT) Directory Guidelines**, our architecture implements a strict **Dual-Brand, Dual-License intellectual property partition**. 

By decoupling our public-good developer utilities from our proprietary consumer-facing application layer, we protect our enterprise market advantages while contributing open-source infrastructure to the broader Web3 ecosystem.

```text
               +-------------------------------------------------+
               |              THE BAZAAR ARCHITECTURE            |
               +-----------------------+-------------------------+
                                       |
                                       | Separated by Design
                                       |
         +-----------------------------+-----------------------------+
         |                                                           |
+--------v-------------------------------+   +-----------------------v-------------------------+
|     PROJECT BAZAAR (Infrastructure)    |   |     BAZAAR REPUBLIC (Application Layer)         |
|                                        |   |                                                 |
| - Repository: `soroban-nexus`          |   | - Repository: `bazaar-republic-alpha`           |
| - License: Permissive MIT              |   | - License: Pi Open Source (PiOS)                |
| - Focus: Low-level Soroban Utilities   |   | - Focus: Commercial marketplace, DAO, & DB      |
| - Funding: Stellar Community Fund      |   | - Listing: Pi Utility Ecosystem Directory       |
+----------------------------------------+   +-------------------------------------------------+
```

---

### 2. Intellectual Property Brand Taxonomy

#### 🛠️ A. Project Bazaar (The Engineering Layer)
*   **Definition:** The developer-facing taskforce, cryptography R&D branch, and decentralized infrastructure group.
*   **Copyright Assertion:** `Copyright (c) 2026 Project Bazaar`
*   **Core Assets:** Lower-level smart contracts, automated TypeScript and PowerShell node diagnostic scripts, continuous integration configurations, and Soroban state lease (TTL) managers.
*   **Distribution Strategy:** Openly hosted on GitHub, formatted as public-good developer toolkits to drive global developer and validator engagement.

#### 🛍️ B. Bazaar Republic (The Application Layer)
*   **Definition:** The proprietary, sovereign, consumer-facing decentralized marketplace, e-network, and peer-to-peer commerce DAO operating natively inside the Pi Browser.
*   **Copyright Assertion:** `© BAZAAR REPUBLIC`
*   **Core Assets:** UI/UX frontend components (Next.js), database configurations and client instantiations (`bzr-db` replica sets), dynamic local fiat pricing hooks, and custom identity passport schemas.
*   **Distribution Strategy:** Enclosed within the secure Pi Network utility perimeter, protected from speculative copycats and strictly locked to native transaction pipelines.

---

### 3. Dual-Licensing Architecture Matrix

| Licensing Parameter | 🛠️ Project Bazaar (Infrastructure) | 🛍️ Bazaar Republic (Application Layer) |
| :--- | :--- | :--- |
| **Applicable Crate/Folder** | `/soroban-nexus` | `/bazaar-republic-alpha` (Main Root) |
| **Legal License** | **MIT License** | **Pi Open Source (PiOS) License** |
| **Codebase Scope** | Shared Soroban Rust contracts (`bazaar-vault`), TTL keeper daemons, and Actions workflows. | Full Next.js client, Prisma schema wrappers, proprietary DB logs, and localization frameworks. |
| **Primary Audience** | Web3 developers, security auditors, and Stellar consensus judges. | Pi Network Pioneers, local physical merchants, and Pi Core Team directory curators. |
| **Modification Rights** | Publicly modifiable, forkable, and integrable into external projects. | Modifiable *strictly* for deployment, hosting, and contributions within the Pi Network. |
| **Target Network** | Stellar Testnet / Soroban VM Host. | Pi Network Enclosed Mainnet Sandbox. |
| **Primary Gas / Medium** | Stellar Testnet XLM (Simulated Gas). | Native L1 Pi / L2 mBZR Utility Fuel. |

---

### 4. Technical Asset Mapping and Access Boundaries

To satisfy security auditors, code repositories are strictly isolated to prevent legal or functional leakage between the permissive MIT layer and the protected PiOS layer:

#### 1. Repository Partition Rules
*   **No Code Pollution:** No proprietary MongoDB schemas, Prisma client instantiations, or localization files from the `bazaar-republic-alpha` root are permitted inside the public `soroban-nexus` directory.
*   **The Interface Boundary:** The proprietary application layer communicates with the smart contracts *strictly* through ABI interfaces, client-side bindings, and environment variables configured in `.env.local` files.
*   **The Compilation Isolation:** The open-source `soroban-nexus` repository compiles to target **`wasm32v1-none`** independently, using standard crates and dependencies without relying on proprietary database modules.

#### 2. Absolute Path Reference Definitions
*   **The Main Root (Sovereign & PiOS):** All proprietary commercial marketplace files, bzr-db configurations, and user interfaces reside at the absolute workstation path:  
    `J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha\`
*   **The Dev-Kit Sandbox (Public & MIT):** The isolated open-source contract toolkit resides at:  
    `J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha\soroban-nexus\`

---

### 5. Compliance and Audit Alignment

#### 🛡️ A. Stellar Community Fund (SCF) Alignment
*   **The "Public Good" Qualification:** By publishing the `soroban-nexus` repository under the MIT license, we satisfy the open-source requirements of the SCF Open Track (Infrastructure & Public Goods). 
*   **Empirical Validation:** Our 6-for-6 local unit test suite provides auditors with instant, verifiable proof that the open-source infrastructure is secure, self-documenting, and fully optimized for Soroban Protocol 28.

#### 🔒 B. Pi Core Team (PCT) Ecosystem Alignment
*   **PiOS Enforcement:** By asserting the PiOS License over the `bazaar-republic-alpha` directory, we strictly align with the PCT Enclosed Mainnet guidelines, protecting the marketplace from speculative external hosting.
*   **Anti-Speculation Controls:** Non-KYC'ed users can utilize the platform internally, but are cryptographically barred from L1 operations (Melt functions) and governance voting, satisfying international regulatory guidelines and Pi security circles.

---
*© BAZAAR REPUBLIC. All rights reserved. Registered under the Pi Open Source (PiOS) Agreement and the permissive MIT Open Source Initiative.*
