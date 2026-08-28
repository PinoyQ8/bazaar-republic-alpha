# 🏛️ PROJECT BAZAAR — SOLOHOST SANDBOX & CLI SETUP GUIDE
### Phase-One Testnet & Genesis Cluster Operator Playbook (v2.7.2)

Welcome to the **Bazaar Republic** DePIN Host Infrastructure. This README serves as the official, authoritative setup playbook for our first **100 Genesis Node Operators**. It outlines how to configure your local directory, initialize the Master Command Center CLI, and run your containerized local testnet sandbox on your physical workstation (such as the Acer Nitro 5).

---

## 💻 1. Host Hardware Minimum Baselines

Before initializing the sandbox, you must verify that your host system meets the strict **Sovereign DePIN v2 standards**. Underperforming nodes degrade aggregate transaction routing and are automatically quarantined.

| Hardware Resource | Minimum Specification | Operational Justification |
| :--- | :--- | :--- |
| **CPU** | 4 Physical Cores | Prevents thread-locking under concurrent off-chain processing |
| **System Memory** | 8 GB RAM | Dedicated buffer for MongoDB replicas and Next.js UI caching |
| **Storage Medium** | Non-rotational SSD / NVMe | **Strictly no HDDs.** Prevents high-frequency database I/O thrashing |
| **SLA Baseline** | 90.0% Uptime (Rolling 30-Day) | Minimum reliability threshold to receive the 70% operator yield |
| **Maintenance Shield** | 72 Hours (10% SLA Allowance) | Allowed window for system updates and reboots without TrustScore decay |

---

## 📂 2. Directory Mapping & Workspace Structure

For the Master CLI (`bazaar_sandbox_cli.ps1`) to orchestrate your sandbox cleanly, align your local directory structure in VS Code as shown below:

```text
/your-project-root/
├── docker-compose-v3.yml         # Container networking & MongoDB replica set manifest
├── bazaar_sandbox_cli.ps1        # Master Interactive Command Center CLI script
├── switch_nitro5_env.ps1          # Port clean-up & environment toggle script
├── healthcheck.sh                # SoloHost system-level active telemetry auditor
├── .env                          # Local environment variables (Port mappings & keys)
├── src/
│   ├── bazaar_relayer.ts         # L1/L2 transaction batch relayer daemon
│   ├── bazaar_closed_loop_engine.ts # 7-decimal BigInt off-chain math engine
│   ├── bazaar_fee_splitter.ts    # Model-3 70/30 fee yield distribution router
│   ├── bazaar_social_service.ts  # Crisis emergency aid and Future Fund floor service
│   └── components/
│       ├── bazaar_bridge_dashboard.tsx # Live Operator monitoring interface
│       └── bazaar_elder_voting_portal.tsx # Cryptographic 3/5 multisig voting portal
```

---

## 🔑 3. Environment Configuration (`.env`)

Create a `.env` file in your root folder and configure the following parameters:

```env
# Database Settings (Enforcing Majority Writes for Idempotency Protection)
DATABASE_URL="mongodb://db:27017/bazaar_republic?replicaSet=rs0&readConcernLevel=majority&w=majority"

# Soroban Testnet Connection Details
SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
BAZAAR_VAULT_CONTRACT_ID="CDI5EAXHES3KPZBLAICUWUSDCLFGTN3MDURTFMQCXTQWFSYRK357YPD6"

# Pi L1 Platform API Gateway (Sandbox Sandbox)
PI_API_URL="https://api.minepi.com/v2"
PI_API_KEY="your_secure_pioneer_api_key_here"
NEXT_PUBLIC_PI_SANDBOX=true
```

---

## 🚀 4. Step-by-Step Installation & Execution

Follow these steps to initialize and boot the Genesis Node sandbox:

### Step A: Configure PowerShell Execution Policies
The CLI requires administrative clearances to control Docker containers, query port listeners, and clean memory bindings.
1. Open **PowerShell** as an **Administrator**.
2. Run the following command to allow execution for the active session:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
   ```

### Step B: Launch the Master Command Center CLI
Navigate to your project root folder and execute the interactive controller:
```powershell
.\bazaar_sandbox_cli.ps1
```

### Step C: Execute the Orchestration Playbook
Inside the interactive command menu, execute the tasks in this sequence to initialize a clean run:
1. **Select `[1]` (Pre-Flight Diagnostics):** Validates your host hardware specifications (CPU, RAM, and SSD write limits).
2. **Select `[2]` (Reset Port Bindings):** Automatically cleans up any lingering processes on port `3000` to prevent socket collisions.
3. **Select `[3]` (Boot Container Stack):** Boots MongoDB, your Next.js frontend, and the helper backend on the secure, isolated `bzr-network`.
4. **Select `[4]` (Initialize & Seed DB):** Automatically runs database seeding, populating both a compliant operator profile and an SLA-failing profile to enable live edge-case testing.
5. **Select `[5]` (Launch L1/L2 Bridge Relayer):** Spawns the background daemon to listen for Soroban event-triggers.

---

## ⚖️ 5. Sandbox Testing & Audit Runs

Once the infrastructure is up, use the built-in diagnostic tools to stress-test your system boundaries:

*   **Option `[6]` (Run Closed-Loop Math Simulation):** Evaluates P2P transfers using 7-decimal BigInt arithmetic. This asserts that the total circulating supply remains perfectly conserved down to `0.0000000 mBZR` after complex micro-fee splits.
*   **Option `[7]` (Test Social Fund & Future Fund Floor):** Attempts to trigger a massive black-swan disaster payout. This confirms that the database service blocks any disbursement that would deplete the fund below the **`300,000.0000000 mBZR` Future Fund Survival Floor**, protecting system-wide longevity.

---

## 🛠️ 6. System Tear-Down & Cleanup

When you are ready to stop development or run a fresh code compile, select **`[8]` (Complete System Tear-Down)**. This gracefully shuts down the containers, clears out mock database state cache, and tears down virtual network bridges, returning your workstation to its default state.

---
© **BAZAAR REPUBLIC**. Authored for the first 100 Genesis Node Operators. In code we trust.
