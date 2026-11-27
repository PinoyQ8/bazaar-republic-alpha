# Bazaar Republic & MESH Academy — PiOS Payment & Environment Architecture

This document outlines the shared Testnet (**ACADEMY**) and Mainnet (**REPUBLIC**) payment architecture, environment isolation boundaries, repository layout, and incomplete-payment recovery flow for `bazaar-republic-alpha` and `bazaar-republic-core`.

---

## 1. Security & Public Repository Boundaries

Because this repository is open and PiOS-compliant, all source code and documentation must remain completely free of credentials, private keys, and connection strings.

### Server-Only Secrets (`.env.local` & Deployment Environment Variables Only)
Never prefix these with `NEXT_PUBLIC_`, and never commit real values to Git:
- `PI_API_KEY`, `PI_TESTNET_API_KEY`, `PI_MAINNET_API_KEY`
- `MESH_HARDWARE_KEY`
- `DATABASE_URL`
- Any Stellar/Soroban wallet secret seeds (`S...`), deployer signing keys, A2U payout signing material, or session/webhook signing secrets

### Client-Safe Public Configuration (`NEXT_PUBLIC_*`)
Only non-secret public identifiers, endpoints, and mode flags are exposed to browser bundles:
- `NEXT_PUBLIC_PI_SANDBOX` (`"true"` for Testnet/Sandbox, `"false"` for Mainnet)
- `NEXT_PUBLIC_PI_TESTNET_CLIENT_ID`, `NEXT_PUBLIC_PI_MAINNET_CLIENT_ID`
- `NEXT_PUBLIC_PI_API_URL`, `NEXT_PUBLIC_PI_RPC_URL`, `NEXT_PUBLIC_SOROBAN_RPC_URL`, `NEXT_PUBLIC_PI_HORIZON_URL`
- `NEXT_PUBLIC_PI_NETWORK_PASSPHRASE`, `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`
- `NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID`, `NEXT_PUBLIC_MESH_VAULTS_CONTRACT_ID`, `NEXT_PUBLIC_MESH_CONTRACT_ID`, `NEXT_PUBLIC_MBZR_TOKEN_CONTRACT`
- `NEXT_PUBLIC_APP_DOMAIN`, `NEXT_PUBLIC_APP_ENVIRONMENT`, `NEXT_PUBLIC_NETWORK_LABEL`

---

## 2. Environment Routing Matrix

Incoming requests resolve dynamically to either **Testnet (Academy)** or **Mainnet (Republic)** based on request host/origin (or explicit server-validated network hint):

| Realm | Network | Sandbox Flag | PiNet / Deployment Hosts | Server API Key Var |
| :--- | :--- | :--- | :--- | :--- |
| `ACADEMY` | `testnet` | `true` | `bazaarrepublic3496.pinet.com`, `mesh-academy-alpha.vercel.app`, `localhost` | `PI_TESTNET_API_KEY` (or `PI_API_KEY`) |
| `REPUBLIC` | `mainnet` | `false` | `bazaardao6650.pinet.com`, `project-bazaar-mainnet.vercel.app` | `PI_MAINNET_API_KEY` (or `PI_API_KEY`) |

---

## 3. Three-Phase Payment & Recovery Flow

All state-changing Pi Platform API calls (`approve`, `complete`, `incomplete`) execute exclusively on the server using `Authorization: Key <SERVER_PI_API_KEY>`.

1. **Client Initialization & Auth (`Pi.init` + `Pi.authenticate`):**
   - Initializes the Pi SDK (`version: "2.0"`) and authenticates with required scopes (`["username", "payments", "wallet_address"]`) and `onIncompletePaymentFound`.
2. **Phase 1 — Server Approval (`POST /api/payments/approve`):**
   - Resolves the active environment via `getMeshServerEnv`.
   - Inspects `GET /v2/payments/:paymentId` to verify network alignment (`testnet` vs. `mainnet`).
   - Calls `POST /v2/payments/:paymentId/approve` on the server.
3. **Phase 2 — On-Chain Pioneer Signature:**
   - Pioneer confirms the transaction inside the Pi Wallet / Pi Browser, producing an on-chain `txid`.
4. **Phase 3 — Server Completion & Settlement (`POST /api/payments/complete`):**
   - Verifies network alignment and calls `POST /v2/payments/:paymentId/complete` with `{ txid }`.
   - Invokes `settleConfirmedPiPayment` **only after** Pi returns `200 OK` with a verified `txid`.
5. **Interrupted Payment Recovery (`POST /api/payments/incomplete`):**
   - Triggered by `onIncompletePaymentFound` during `Pi.authenticate(...)` before a client session token exists.
   - Server inspects `GET /v2/payments/:paymentId` with `Authorization: Key <SERVER_PI_API_KEY>`. If a `txid` exists and `developer_completed` is `false`, the server completes and settles the payment idempotently.

---

## 4. Repository & Workspace Layout

### `bazaar-republic-alpha` (Next.js App, API Routes & Contracts)
- `lib/pi/paymentEnv.ts` — Server-only network/environment resolver (`ACADEMY` vs. `REPUBLIC`)
- `lib/pi/piPlatform.ts` — Server-only Pi Platform API v2 HTTP client & network mismatch guard
- `lib/pi/settlementHook.ts` — Post-completion database/escrow settlement hook
- `app/api/payments/approve/route.ts` — Server payment approval endpoint
- `app/api/payments/complete/route.ts` — Server payment completion & settlement endpoint
- `app/api/payments/incomplete/route.ts` — Server incomplete-payment recovery endpoint
- `app/utils/safePi.ts` — Shared client Pi SDK authentication and incomplete-payment callback wrapper
- `components/` & `app/components/` — Auth gates and checkout UI (`PiAuthButton.tsx`, `PiPaymentButton.tsx`, `PioneerAuthGate.tsx`, `PiAuthGate.tsx`, `LivePiCheckout.tsx`)
- `hooks/` & `app/hooks/` — Client React hooks (`usePiAuth.ts`, `usePasskeyAuth.ts`)

### `bazaar-republic-core` (Rust Workspace)
- Dedicated Rust codebase maintained separately from `bazaar-republic-alpha` for core protocol/contract development.

---

## 5. Maintenance & Fallback Rules

- **Path Alias Precedence (`tsconfig.json`):** `@/lib/*` resolves `./src/lib/*` before `./lib/*`, and `@/components/*` resolves `./src/components/*` before `./components/*` and `./app/components/*`. Keep a single canonical implementation per module to prevent shadowed files.
- **Legacy Route Compatibility:** If legacy components post `{ action: "approve" | "complete" | "incomplete" }` to `/api/payments`, route them through the same `getMeshServerEnv` + `piPlatform` + `settleConfirmedPiPayment` helpers so network verification and server-only key handling are never bypassed.
- **No Synthetic Transaction IDs:** Database and escrow settlement records must only be written after a real blockchain `txid` is confirmed by Pi Servers.