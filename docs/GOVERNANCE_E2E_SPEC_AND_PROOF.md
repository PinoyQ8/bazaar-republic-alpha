# Project Bazaar — Governance Specification & E2E Proof of Execution

- **Milestone Date:** November 26, 2026
- **Environment:** `bazaar-republic-alpha` (Local Replica Set `rs0` / `bazaar_republic`)
- **Status:** Verified End-to-End across Happy Path, 72h Founder Hold, Succession Quorum, Defeat, and Guardrails

---

## 1. Constitutional Governance Architecture

Project Bazaar enforces a two-stage chamber-ratified governance pipeline paired with automated Founder Vision parameter scoring and a 72-hour Chamber 1 review window.

### 1.1 Two-Stage Ballot & Chamber Ratification (`app/api/governance/proposals/[id]/route.ts`)
1. **Stage 1 (`PRIMARY_TIER` / `status: "ACTIVE"`):**
   - Voting is restricted exclusively to verified nodes belonging to the proposal's originating chamber (`originTier`).
   - Non-origin chamber ballots are blocked (`403 STAGE_1_PRIMARY_TIER_ONLY`), and duplicate votes in the same stage are blocked (`409 VOTE_ALREADY_CAST`).
   - Once the primary chamber meets quorum and achieves $\ge 80\%$ approval, the proposal automatically transitions to `status: "GLOBAL_ACTIVE"` (`votingStage: "GLOBAL_OTHER_TIERS"`) and records `primaryPassedAt` and `globalVotingUnlockedAt`.
2. **Stage 2 (`GLOBAL_OTHER_TIERS` / `status: "GLOBAL_ACTIVE"`):**
   - Cross-chamber ratification opens across all five chambers (`FOUNDER`, `GENESIS`, `MERCHANT`, `SERVICE_PROVIDER`, `CITIZEN`).
   - Once $\ge 80\%$ of chambers ($\ge 4$ of $5$) satisfy quorum and approval thresholds, the proposal automatically promotes to `status: "PASSED"`.

### 1.2 Founder Vision Gating & Autonomous Corridors (`app/api/governance/proposals/[id]/execute/route.ts`)
When `POST /api/governance/proposals/[id]/execute` runs on a `PASSED` proposal, `scoreFounderVision()` evaluates the target parameter and proposed value against the autonomous corridor registry:

| Target Parameter | `ProtocolConfig` Key | Autonomous Range (`[min, max]`) | Constitutional Pillar Check |
| --- | --- | --- | --- |
| `MUTUAL_AID_ALLOCATION` | `republic.shield.mutualAidCapMbzr` | `[100, 10000]` | Pillar 3 (Monetary Parity) |
| `UPTIME_SHIELD_TARGET_PCT` | `mesh.uptimeShieldTargetPct` | `[92, 98]` | Pillar 1 (Compute Sovereignty, $\ge 92\%$ floor) & Pillar 3 |
| `ESCROW_TIMELOCK_HOURS` | `escrow.defaultTimelockHours` | `[48, 120]` | Pillar 2 (Non-Custodial Trust, $\ge 48\text{h}$ floor) & Pillar 3 |
| `MERCHANT_TRADE_LEVY_BPS` | `economy.merchantTradeLevyBps` | `[150, 250]` | Pillar 3 (Monetary Parity) |
| `NODE_YIELD_SPLIT_PCT` | `economy.soloHostYieldSplitPct` | `[70, 80]` | Pillar 1 (Compute Sovereignty, $\ge 70\%$ floor) & Pillar 3 |
| `DISPUTE_MIN_BOND_MBZR` | `justice.minDisputeBondMbzr` | `[50, 500]` | Pillar 3 (Monetary Parity) |

- **In-Bounds (`visionAlignmentPct === 100`):** Returns `200 OK`, transitions proposal to `EXECUTED`, upserts `ProtocolConfig`, and seals execution with a SHA-256 `executionSealHash`.
- **Out-of-Bounds or Qualitative (`visionAlignmentPct < 100`):** Returns `202 Accepted`, transitions proposal to `HOLD_AND_MODIFY`, populates `holdReason`, and opens a 72-hour decision window (`holdExpiresAt = now + 72h`).
- **Defeated Ballot:** Proposals failing chamber thresholds transition to `REJECTED` (`BALLOT_DEFEATED`) and set author `lastProposalOutcome: "DEFEATED"`.

### 1.3 72-Hour Founder Hold & Succession Rules (`app/api/governance/proposals/[id]/founder-hold/route.ts`)
- **Chamber 1 Authority Modes:**
  - `FOUNDER_ACTIVE`: Requires an active `BAZAAR_FOUNDER` signature (`403 CHAMBER_1_UNAUTHORIZED` otherwise).
  - `DESCENDANTS_ACTIVE`: Requires $\ge 80\%$ combined weight across `FOUNDER_DESCENDANT` signers (`403 DESCENDANT_QUORUM_INSUFFICIENT` if $< 80\%$).
- **Accountability & Expiration:**
  - Requires a non-empty `publicRationale` of at least 15 characters (`400 RATIONALE_REQUIRED`).
  - Requests submitted after `holdExpiresAt` fail with `422 HOLD_WINDOW_EXPIRED` and transition the proposal to `EXPIRED`.
- **Supported Chamber 1 Actions:**
  - `MODIFY_AND_RESUBMIT`: Updates parameter/metadata, clears `holdExpiresAt`, and reopens `status: "ACTIVE"` with a 48-hour collaborative re-ballot window (`ACTIVE_REBALLOT_48H`).
  - `APPROVE_OVERRIDE`: Transitions proposal to `EXECUTED` (`visionAlignmentPct: 100`) with a SHA-256 `executionSealHash`.
  - `SOFT_VETO`: Transitions proposal to `REJECTED` (`REJECTED_SOFT_VETO`) with a SHA-256 `executionSealHash`.

---

## 2. E2E Proof of Execution Ledger

Every state transition, guardrail status code, database mutation, and SHA-256 seal hash below was executed and verified against the running Next.js API and MongoDB replica set (`bazaar_republic`):

| Test Case | Proposal ObjectId | Endpoint & HTTP Status | State Transition & Cryptographic / DB Proof |
| --- | --- | --- | --- |
| **1. Two-Stage Happy Path Execution** | `6b0813ef09933c2bb69fef15` | `POST .../proposals/[id]` (`201`) $\rightarrow$ `POST .../execute` (`200 OK`) | `ACTIVE` $\rightarrow$ `GLOBAL_ACTIVE` $\rightarrow$ `PASSED` $\rightarrow$ `EXECUTED`; `visionAlignmentPct: 100`; `ProtocolConfig` upserted (`key: "republic.shield.mutualAidCapMbzr"`, `value: 1000`, `id: "6b0827bd09933c2bb69fef24"`); `executionSealHash: "25df4caaee5a579f97bfba1614812f067bc0623f5171d9bd8e39174132e9427c"` |
| **2. Hold Window + `MODIFY_AND_RESUBMIT`** | `6b082899afaecef7e69df8a3` | `POST .../execute` (`202 Accepted`) $\rightarrow$ `POST .../founder-hold` (`200 OK`) | `UPTIME_SHIELD_TARGET_PCT: 88` held (`HOLD_AND_MODIFY`, `visionAlignmentPct: 60`, `holdExpiresAt: "2026-11-29T12:40:11.119Z"`); modified to `94` and reopened (`status: "ACTIVE"`, `ACTIVE_REBALLOT_48H`, `expiresAt: "2026-11-28T12:41:26.948Z"`); `sealHash: "9f877090702d739735dda0baa069a01d53524d6338ad64508c860a9eba216384"` |
| **3. Hold Window + `APPROVE_OVERRIDE`** | `6b082952f2701e4b8c9df8a3` | `POST .../execute` (`202 Accepted`) $\rightarrow$ `POST .../founder-hold` (`200 OK`) | `UPTIME_SHIELD_TARGET_PCT: 89` held (`HOLD_AND_MODIFY`), then overridden to `status: "EXECUTED"` (`visionAlignmentPct: 100`, `executedAt: "2026-11-26T12:43:20.314Z"`); `executionSealHash: "33165090d2601b536a66bc221bea37e7acd5a282795e74d6be837e691f588d7f"` |
| **4. Hold Window + `SOFT_VETO`** | `6b082952f2701e4b8c9df8a4` | `POST .../execute` (`202 Accepted`) $\rightarrow$ `POST .../founder-hold` (`200 OK`) | `UPTIME_SHIELD_TARGET_PCT: 90` held (`HOLD_AND_MODIFY`), then vetoed (`REJECTED_SOFT_VETO`, `proposal.status: "REJECTED"`); `executionSealHash: "5c8a4274844917614dab6488d9714b17ebb21df188299e3ca10407e5adb88a94"` |
| **5. Ballot Defeat & Cooldown Outcome** | `6b082a444a2e1a46c29df8a3` | `POST .../execute` (`200 OK`) | Failed $\ge 80\%$ threshold (`0` YES, `2` NO in `MERCHANT`); `finalStatus: "REJECTED"`, `holdReason: "BALLOT_DEFEATED: Passed 0/1 required chambers."`, author `test_defeat_author_01.lastProposalOutcome` set to `"DEFEATED"` |
| **6. Guardrails (`400`, `403`, `409`)** | `6b082a82819542c1009df8a4` & hold fixture | `POST .../founder-hold` (`400`, `403`) & `POST .../proposals/[id]` (`403`, `201`, `409`) | Short rationale (`400 RATIONALE_REQUIRED`); non-Founder signer (`403 CHAMBER_1_UNAUTHORIZED`); non-origin Stage 1 vote (`403 STAGE_1_PRIMARY_TIER_ONLY`); duplicate Stage 1 vote (`409 VOTE_ALREADY_CAST`) |
| **7. `DESCENDANTS_ACTIVE` 80% Quorum** | `6b082b210d509baccd9df8a3` | `POST .../founder-hold` (`403` $\rightarrow$ `200 OK`) | `60%` signed weight rejected (`403 DESCENDANT_QUORUM_INSUFFICIENT`); `85%` signed weight (`50% + 35%`) accepted (`200 OK`, `REJECTED_SOFT_VETO`); `executionSealHash: "5078239c54f237b5ff35d30581a31ea5becd54fec32fb53c163a0efc0cc75889"` |
| **8. 72h Hold Window Expiration** | `6b082b210d509baccd9df8a4` | `POST .../founder-hold` (`422 Unprocessable Entity`) | Past-due `holdExpiresAt` (`2026-11-23T11:50:41.245Z`) returned `422 HOLD_WINDOW_EXPIRED` and transitioned proposal to `status: "EXPIRED"` |

---

## 3. Verification & Hygiene Protocol for Future Changes

1. **Co-Update Spec & Code:** Update Section 1 whenever parameter bounds (`AUTONOMOUS_HANDLERS`), chamber quorum rules, or state transitions change.
2. **Append Proof Rows:** Record new proposal ObjectIds, HTTP status codes, and SHA-256 `executionSealHash` digests in Section 2 whenever governance routes are modified.
3. **Prune Synthetic Fixtures After Verification:** Remove `test_*` nodes, logs, votes, and `"E2E ..."` proposals from `bazaar_republic` after archiving proof hashes so production/staging collections remain clean.