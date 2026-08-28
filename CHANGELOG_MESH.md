# 🏛️ PROJECT BAZAAR: MESH PROTOCOL CHRONICLE

All major architectural milestones, economic pivots, and infrastructure deployments are logged in this ledger.

---

## [ v0.3.0-alpha ] — 2026-08-12 (The Dual-Token & Paymaster Era)
- **Engine Core:** Forged `lib/treasuryPaymaster.ts` to execute gasless internal `mBZR` velocity transfers while subsidizing L1 `0.01 Pi` network fees from the `EpochBuffer` treasury reserve.
- **Economic Model:** Formally deprecated static "synthetic gold" framing in favor of velocity and stake-weighted `mBZR` circulation.
- **Security & Auth:** Upgraded `app/e-network/contract/deploy/page.tsx` with automatic fallback `Pi.authenticate()` and Bearer token header injection for API gate authorization.
- **Environment:** Locked local SSL remote gateway tunnel (`pi-app-solohost-remote-gateway-1` on Port `31409`) to bypass Vercel restrictions during S23 mobile node testing.
- **Provider Infrastructure:** Upgraded server-side provider profiles (`app/e-network/provider/[id]/page.tsx`) with resilient escrow lock telemetry and fallback typing.

---

## [ v0.2.0-alpha ] — 2026-07-28 (The Core Infrastructure Era)
- **SDK Integration:** Injected global Pi SDK script via `app/layout.tsx` (`beforeInteractive`) and established `MeshInitializer.tsx` with Sandbox state management.
- **Database Architecture:** Configured MongoDB cluster via Prisma schema for Pioneer nodes and ledger events.
- **Component Design:** Built asynchronous server components for node profile inspection and escrow contract deployment.

---

## [ v0.1.0-alpha ] — 2026-06-14 (Genesis Block)
- Initialized Next.js 15 App Router structure under the Neo Protocol / Project Bazaar framework.
- Established terminal workstation environment on the X570 Taichi build.