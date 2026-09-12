# Bazaar Republic Alpha: DePIN SoloHost Node Operator Guide & Runbook

**Document Version:** `v4.2.0`  
**Target Audience:** Genesis Cohort & DePIN Node Operators  
**System Target:** Pi Desktop SoloHost v2 / Docker Desktop Engine  
**Copyright:** © BAZAAR REPUBLIC — *In code we trust*

---

## 🏛️ 1. Executive Summary & Operator Architecture

The **Bazaar Republic Layer-2 E-Network** relies on a decentralized grid of physical compute nodes running the **DePIN SoloHost v2** container stack. As a Bazaar Node Operator, your machine processes application-layer transactions, database state replication (`bzr-db`), and off-chain zero-knowledge verifications (`mesh-zk-verifier`) while earning a **70% share of L2 micro-fee swap yields**.

### 🖥️ Minimum Viable Hardware (MVH) & Operational SLA
* **CPU:** 4 Cores (x86_64 architecture required; strictly bans ARM64/Raspberry Pi due to emulation latency).
* **RAM:** 8 GB RAM (Mandatory floor for concurrent Next.js, MongoDB, and ZK-verifier execution).
* **Storage:** Physical SSD (NVMe or SATA; HDDs disqualified to prevent I/O bottlenecks).
* **30-Day Rolling SLA Floor:** **90.0% Uptime** (720-hour window).
* **Maintenance Buffer:** **10% (72 Hours)** monthly allowance for upgrades, OS patches, or network maintenance.

---

## ⚙️ 2. SoloHost Package Installation Protocol

Node operators do not need to clone source code repositories, compile TypeScript, or manage local MongoDB installations manually. Installation is **zero-touch** via the Pi Desktop interface.

### 📥 One-Click Pi Desktop Installation
1. Open **Pi Desktop** on your host PC (ensure Docker Desktop is running with WSL2 enabled).
2. Navigate to **SoloHost / Local Apps** in the left panel.
3. Click **Import / Install Local Package** and select `bazaar-republic-alpha-package.zip`.
4. When prompted by `config_options.yml`, confirm the default database gateway URI or enter your assigned cluster endpoint.
5. Click **Install / Launch**. Pi Desktop automatically pulls `docker.io/pinoyq8/bazaar-republic-alpha:latest`, binds port `3000`, and starts background telemetry.

---

## 📱 3. Telegram Operator Bot Configuration (`.env.local`)

Real-time telemetry and SLA warnings are dispatched directly to your mobile phone via private Telegram API webhooks. 

### 🔐 Environment Credentials (`.env.local`)
Create or edit `.env.local` inside your app root directory (`J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha\.env.local` or `C:\Project-Bazaar\.env.local`):

```env
# =========================================================
# BAZAAR REPUBLIC ALPHA - TELEGRAM OPERATOR BOT ALERTS
# Location: .env.local
# =========================================================

# 1. API Token obtained from @BotFather in Telegram
TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"

# 2. Your numeric Telegram User ID obtained from @userinfobot or browser getUpdates
TELEGRAM_CHAT_ID="your_numeric_chat_id"

# 3. Unique Node Identifier across your fleet
NODE_ID="X570-Master"   # Use "X570-Master" for Primary Workstation, "Nitro5-SoloHost" for Failover
```

> **Privacy Note:** Alerts are sent **strictly** to your private `TELEGRAM_CHAT_ID`. Secondary nodes (e.g., laptop failovers) can use the same `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` with their respective `NODE_ID` to send all fleet alerts directly to your phone without requiring Telegram Desktop to be installed on secondary devices.

---

## 🚨 4. Real-Time Telemetry & Alert Suite

The Telegram Operator Bot daemon (`lib/telegram_notifier.ts`) automatically dispatches rich Markdown notifications for four core telemetry events:

| Alert Type | Icon | Trigger Condition | Function / API Hook |
| :--- | :---: | :--- | :--- |
| **Node Online** | ✅ | Successful heartbeat sync on startup or recovery | `sendTelegramAlert({ level: 'SUCCESS' })` |
| **Uptime SLA Shield** | 🚨 | Node uptime drops below **90.0%** or enters `QUARANTINED` status | `notifySlaShield(nodeId, uptime, 'CRITICAL')` |
| **Low Soroban Gas** | ⚠️ | Keeper signer XLM balance drops below **10.00 XLM** safety buffer | `notifyLowGas(balanceXlm, thresholdXlm)` |
| **Escrow State Update** | ℹ️ | Escrow contract lifecycle transitions (`LOCKED`, `RELEASED`, `REFUNDED`, `DISPUTED`) | `notifyEscrowState(escrowId, status, amountPi)` |

---

## 🧪 5. Operator Diagnostic & Verification Commands

Operators can verify their setup or trigger manual diagnostic pings directly from PowerShell or Terminal.

### 1. Test Node Online Ping
```powershell
npx tsx -e "import('./lib/telegram_notifier').then(m => m.sendTelegramAlert({ title: 'X570 Online', message: 'Telegram Operator Bot connected to X570 Master Workstation!', level: 'SUCCESS' }))"
```

### 2. Simulate SLA Uptime Shield Quarantine Warning
```powershell
npx tsx -e "import('./lib/telegram_notifier').then(m => m.notifySlaShield('X570-Master', 84.5, 'CRITICAL'))"
```

### 3. Simulate Low Soroban Gas Warning
```powershell
npx tsx -e "import('./lib/telegram_notifier').then(m => m.notifyLowGas(4.25, 10.0, 'GBX570KEEPERADDRESSEXAMPLE1234567890'))"
```

### 4. Simulate Escrow Lock Notification
```powershell
npx tsx -e "import('./lib/telegram_notifier').then(m => m.notifyEscrowState('ESC-TEST-8131', 'LOCKED', 50, '0b325d02329381fa2c3f0a28a996f0149480dea7d8ef89ff3530b42c8025eef8'))"
```

---

## 🖥️ 6. Fleet Node Management (`X570-Master` vs `Nitro5-SoloHost`)

For operators managing multiple hardware nodes (e.g., Primary Workstation + Laptop Failover):

* **Independent Database Identity:** Primary node registers as `Node-001` (`X570-Master`), failover registers as `Node-002` (`Nitro5-SoloHost`).
* **Independent 30-Day SLA:** Each physical machine maintains its own independent rolling 90% Uptime Shield calculation.
* **Unified Mobile Operator Control:** Setting the same `TELEGRAM_CHAT_ID` across both nodes routes all alerts to a single phone, allowing remote oversight of both machines simultaneously.

---

## 🚀 7. Next-Phase Feature Roadmap

1. **Interactive Telegram Bot Commands (`/status`, `/health`, `/yield`, `/refuel`):** Query live container CPU/RAM, active peers, accrued $mBZR yield, and trigger automated gas top-ups via chat.
2. **Automated Master/Failover Hot-Standby Switch:** Automatic promotion of secondary failover nodes if the primary node goes offline for >3 minutes.
3. **Docker Log Rotation & SSD Sentinel:** Capping container logs to 100MB and alerting when available SSD disk space drops below 10%.
4. **1-Tap Biometric Yield Claims:** Mobile Telegram push notifications deep-linking to WebAuthn / Samsung Knox passkey sweep triggers.
