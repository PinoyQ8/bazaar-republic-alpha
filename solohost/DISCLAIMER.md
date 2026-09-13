# Legal Notice & Architecture Disclaimers

## 1. Scope of Wrapper License vs. Core Intellectual Property (§11.3, §12.1)
* **Wrapper Scope:** The MIT License in this directory applies exclusively to packaging manifests, orchestration scripts, and configuration templates (including `docker-compose.yml`, `config_options.yml`, `solohost.json`, and validation tooling)[cite: 1, 8, 10].
* **Proprietary Core Workloads:** The underlying container image (`pinoyq8/bazaar-republic-alpha`), application binaries, MESH runtime engines, Soroban smart contract bytecodes (`bazaar-vault`), and database models remain the intellectual property of Project Bazaar and are separately governed by the Pi Open Source (PiOS) License Agreement[cite: 1, 2, 16].

## 2. Self-Hosted Execution & User Environment Risks (§2.2, §5.1, §9.1–9.4)
* **Self-Hosted Infrastructure:** SoloHost operates solely as a local software runner; application execution occurs exclusively within the operator's local User Environment[cite: 1].
* **Resource & System Responsibility:** The operator assumes sole responsibility for system compute utilization (CPU, memory, storage), local network exposure, firewall boundaries, and Docker storage persistence[cite: 1].
* **No Platform Backups:** SoloHost does not provide automated data backups; operators are solely responsible for maintaining local database snapshots and storage redundancy[cite: 1].

## 3. No Platform Endorsement or Security Certification (§7.1–7.3, §13.1–13.3)
* **Independent Publication:** This application is published by an independent developer and is not developed, maintained, certified, or endorsed by the Pi Community Company or Pi Core Team[cite: 1].
* **Absence of Review:** SoloHost enforces zero pre-publication code reviews, security scans, malware analyses, or penetration tests[cite: 1]. Node operators install and execute this software entirely at their own discretion and risk[cite: 1].

## 4. Credential & Node Security (§5.1, §10.1)
* **Zero Secret Inclusion:** This wrapper does not store, collect, or inject private seed phrases, Soroban secret keys, or production `PI_API_KEY` credentials[cite: 1, 16].
* **Network Isolation:** Node instances must connect exclusively through local proxy bridges or designated RPC gateways without granting external containers direct access to host credentials[cite: 1].

## 5. Upstream Open-Source Pass-Through Attribution (§11.3, §12.2)
This package coordinates components that rely on open-source dependencies:
* **MongoDB:** Server Side Public License (SSPL) / Community Edition[cite: 1, 2]
* **Next.js & Prisma ORM:** MIT License / Apache 2.0[cite: 1, 2]
* **Stellar / Soroban Rust SDK:** Apache 2.0[cite: 1, 2]