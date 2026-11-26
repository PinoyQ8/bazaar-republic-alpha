# Project Bazaar (Bazaar Republic) — Architecture Overview

## 1. System Overview
Project Bazaar is a decentralized Layer-2 marketplace and DAO built natively on Pi Network infrastructure and Soroban smart contracts (`CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV`), combining on-chain vault settlement, post-quantum (`ML-DSA-65`) dispute resolution, 75/25 Schelling bond/reward distribution, and a Next.js + Prisma/MongoDB (`bzr-db`) application layer.

## 2. Three-Tier Protocol Stack
- **Neo Protocol:** Domain and DAO governance workflows.
- **MESH Protocol:** Security guardrails, governance quorums, Uptime Shield telemetry, and dispute adjudication logic.
- **Pi Network / Soroban Vault Layer:** On-chain escrow locking (`lock_funds`), dispute escalation (`dispute_escrow`), and post-quantum dispute settlement (`resolve_dispute_with_pq`), with stroop precision ($1\text{ PI} = 10^7\text{ stroops}$).

## 3. Escrow & Post-Quantum Dispute Resolution Flow
1. **Lock:** Funds are locked on-chain under a sanitized escrow identifier (`PQ30_*`) with consumer, provider, token contract, amount (in stroops), and duration.
2. **Dispute:** An active `Locked` escrow transitions to `Disputed` on-chain via `disputeEscrow`.
3. **Resolve (`POST /api/escrow/dispute/resolve`):**
   - Resolves target escrow/dispute metadata safely (guarding 24-hex ObjectID lookups so non-BSON string IDs do not trigger `Malformed ObjectID` query errors).
   - Fetches live on-chain vault state (`getVault`) when needed to align `amountStroops` and participant addresses.
   - Executes `resolveDisputeWithPq` with the ruling (`FAVOR_MERCHANT` $\rightarrow$ `RELEASED` / `RESOLVED_MERCHANT`, or `FAVOR_CONSUMER` $\rightarrow$ `REFUNDED` / `RESOLVED_CONSUMER`), payout address, amount in stroops, and monotonic `nonce`.
   - Computes the 75/25 Schelling bond/reward ledger (`75%` winner compensation, `25%` majority Elder pool) and syncs database state when available, falling back cleanly to `LEDGER_ONLY` if on-chain execution or signer configuration is unavailable.

## 4. UI Adjudication Surface (`/mesh/escrow` & `ElderDisputeModal`)
- Displays dispute summary metrics (escrow amount, security bond, estimated Elder yield, and quorum progress).
- Submits rulings (`FAVOR_CONSUMER` / `FAVOR_MERCHANT`) with `disputeId` and `escrowId` to `/api/escrow/dispute/resolve`.
- Handles `202` pending-quorum states, `200` settlement confirmations (`ON_CHAIN_PQ` / `LEDGER_ONLY` and `txHash`), and error states cleanly.
