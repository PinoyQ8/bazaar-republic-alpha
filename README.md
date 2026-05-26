# Project Bazaar: Decentralized E-Network

Welcome to the central repository for **Project Bazaar**, a Decentralized Autonomous Organization (DAO) built within the Pi Network Ecosystem. Our core logic is driven by **The MESH Protocol**, hard-coding decentralized security and ensuring steady project evolution.

---

## 📡 Active Deployment Nodes

To maintain a 92% Uptime Shield and ensure Zero-Trust testing, this repository routes to two strictly isolated Vercel deployment nodes:

* 🌍 **Mainnet (The True Ledger):** [project-bazaar-mainnet.vercel.app](https://project-bazaar-mainnet.vercel.app)
  * *Purpose:* The public-facing E-Network ledger. Connects exclusively to the production database.
* 🛠️ **Alpha Sandbox (The Logic Forge):** [mesh-academy-alpha.vercel.app](https://mesh-academy-alpha.vercel.app)
  * *Purpose:* The active testing node for mobile Pi Browser verification. Connects exclusively to the isolated Alpha database.

---

## ⚙️ The MESH Architecture

Project Bazaar utilizes a modern, resilient tech stack designed for high-frequency transaction security and seamless user onboarding.

* **Framework:** Next.js (App Router, Server Actions)
* **Database:** MongoDB Atlas (Mongoose Validation Shield)
* **Authentication:** NextAuth & Pi Network Native Handshake
* **Styling:** Tailwind CSS (Hard-coded UI perimeters)

---

## 🚀 Local Node Ignition (X570 Protocol)

To spin up a local logic forge and contribute to the MESH:

### 1. Secure the Vault
You must have a `.env.local` file placed in the root directory. For security, this file is intentionally ignored by `.gitignore`. It must contain your isolated Alpha testing keys:
```text
MONGODB_URI="mongodb://<alpha_user>:<password>@cluster.../bazaar_republic_alpha?ssl=true..."
PI_API_KEY="your_sandbox_key"
NEXTAUTH_SECRET="your_local_secret"
