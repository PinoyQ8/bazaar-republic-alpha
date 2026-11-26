# Project Bazaar — Escrow Vault Specification & Proof of Execution

- **Document Date:** November 26, 2026
- **Protocol Version:** Protocol 30 ("Bell", Pi Testnet)
- **Vault Contract ID:** `CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV` (`NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID` / `BAZAAR_VAULT_CONTRACT_ID`)
- **Vault WASM Hash:** `f4daec0bc8f362502e470a2842479fdbb34659fba81527392282a31f84bc8c6c`
- **Deploy Tx Hash:** `3d8238c0e3e6497a939269a5266e34c1f9a78d1bf11eecb40d64f06521c2e4ac`
- **Deploy Ledger:** `27895529`
- **Database & API Layer:** `bazaar_republic` (`EscrowLock`, `DisputeRecord`) & Next.js `/api/vault`, `/api/escrow/release`, `/api/escrow/dispute/resolve`, `/api/escrow/list`

---

## 1. Escrow Architecture & Lifecycle States

Project Bazaar combines Soroban Protocol 30 ("Bell") smart-contract vault storage with Next.js API endpoints and MongoDB (`EscrowLock` and `DisputeRecord`) state tracking.

### 1.1 Core Lifecycle Operations
1. **Lock (`lock_funds` / `LOCKED`):** Locks buyer/consumer funds in the Protocol 30 ("Bell") vault contract (`CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV`) with `consumer`, `provider`, `amount`, `expires_at`, and `protocol_version: 30`, with optional/async `EscrowLock` persistence in MongoDB.
2. **Release (`release_funds` / `RELEASED`):** Transitions a locked escrow to `Released` on-chain and `RELEASED` in `EscrowLock`, recording settlement transaction details and suppressing post-settlement action buttons in `EscrowCard.tsx`.
3. **Timelock Timeout Refund (`refund_funds` / `REFUNDED`):** Allows refund clawback after expiration/timelock elapses (`expires_at` / `timelockExpiresAt`), returning funds to the consumer and updating `EscrowLock.status` to `REFUNDED`.
4. **5-Elder VRF Dispute & 75/25 Schelling Adjudication (`DISPUTED` -> `REFUNDED` / `RELEASED`):**
   - Disputed escrows freeze direct release/clawback actions while a 5-Elder panel (`VOTING`) adjudicates.
   - Requires a 3-of-5 majority (`FAVOR_CONSUMER` -> `RESOLVED_CONSUMER` / `REFUNDED`, or `FAVOR_MERCHANT` -> `RESOLVED_MERCHANT` / `RELEASED`).
   - Bond settlement applies a 75 / 25 split: **75%** of the bond pool to the winning party (`winnerCompensationMbzr`) and **25%** (`elderPoolTotalMbzr`) divided across the participating majority Elders.

### 1.2 Operational Parity & Edge Cases to Audit
- **On-Chain vs. DB/Ledger-Only Settlement:** Verify whether a given endpoint or test run executed live on-chain (`ON_CHAIN` + Soroban `txHash`) or updated ledger/DB state (`LEDGER_ONLY`), and handle records created in pure on-chain mode (`dbSynced: false`) without false `404` errors when MongoDB is offline.
- **Dispute Record Consistency:** Ensure dispute votes and resolutions update the canonical `DisputeRecord` / `EscrowLock` state consistently and reflect cleanly on `/api/escrow/list`, `/api/vault`, and `/mesh/escrow`.

---

## 2. Recorded Escrow Verification Entries

Entries compiled from recorded escrow runs and audits in the project knowledge base (scoped to **Protocol 30 "Bell"**, vault contract `CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV`, deployed at ledger `27895529` via tx `3d8238c0e3e6497a939269a5266e34c1f9a78d1bf11eecb40d64f06521c2e4ac`):

| Scenario / Record | Escrow / Dispute ID | Mode & Result | Recorded Proof Details |
| --- | --- | --- | --- |
| **Browser Release Settlement** | `ESC_TEST_UI_02` | On-Chain Confirmed (`Released`) | Settled `750000` stroops (`0.0750` Test-Pi) on Protocol 30 ("Bell") vault `CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV`; tx hash `41b3711bf1ef93f3d2d47cec645b1c4573f192e81a6d920a67e750f143a5707a` |
| **On-Chain Vault Readback** | `ESC_DISP_9059` | `ON_CHAIN` (`Released`) | Resolved live from Soroban Protocol 30 ("Bell") vault `CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV`; `100000` stroops (`0.01` Pi), `expires_at: "1795624877"`, upserted `RELEASED` in `EscrowLock` |
| **Timelock Expiration Clawback** | `ESC_TIMELOCK_7305` | `refund_funds` -> `REFUNDED` | Locked `100000` stroops (`0.01` Test-Pi, `expires_at: 1790332790`) on Protocol 30 ("Bell") vault `CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV`, invoked `refund_funds`, verified on-chain `Refunded` via `get_vault`, and synced `EscrowLock.status` to `REFUNDED` |
| **5-Elder Schelling Dispute Settlement** | `ESC_KNOX_3449` (`6b008f4a554d1f2cf25bbc75`) | `200 OK` (`RESOLVED_CONSUMER` -> `REFUNDED`) | `settlementMode: "LEDGER_ONLY"`, `txHash: "0x_vrf_schelling_1a1fa2fbc6f"`; `50` mBZR principal + `750` mBZR (`75%` of `1000` mBZR bond) = `800` mBZR winner credit; `250` mBZR (`25%`) split across `3` majority Elders (`83.3333` mBZR each) |
| **5-Elder Dispute Adjudication** | `ESC_DISP_901` (`6ab94f33ffbc0b6106109c24`, dispute `6b070c911c26bd923a2ff496`) | `DISPUTED` / `VOTING` (50 PI) | Tracked in `EscrowLock` (`50` PI, `DePIN Relayer Telemetry Audit`) and `DisputeRecord` (`bondAmount: 5000`, `selectedElders: ["usr_elder_1".."usr_elder_5"]`, `status: "VOTING"`) |

---

| **Live P30 Lock & Release (`release_funds`)** | `E2E_P30_1795700067` | On-Chain Confirmed (`Released`) | Locked `100000` stroops (`0.01` Pi, `expires_at: 1795703673`, `protocol_version: 30`) on `CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV` (consumer `GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3`, provider `GA7UMIANNCXSZK5NQ7GCAWL3BP3GOBGVRHLSRYY5WI2KZG4SRFLZSARW`); invoked `release_funds --consumer` and verified `status: 'Released'` via `get_vault` |

| **Live P30 Lock & Dispute (`dispute_escrow`)** | `DISP30_E2E_1795700656` | On-Chain Confirmed (`Disputed`) | Locked `100000` stroops (`0.01` Pi, `expires_at: 1795704266`, `protocol_version: 30`) on `CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV` (consumer `GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3`, provider `GA7UMIANNCXSZK5NQ7GCAWL3BP3GOBGVRHLSRYY5WI2KZG4SRFLZSARW`); invoked `dispute_escrow --caller` (signing tx `ef561b1a96e2c53ab2a48dd42cd1f528cea6b72ea913fab736f40e0e5637b8ac`) and verified `status: 'Disputed'` via `get_vault` |

| **Live P30 Timelock Lock & Refund (`refund_funds`)** | `REF30_E2E_1795700967` | On-Chain Confirmed (`Refunded`) | Locked `100000` stroops (`0.01` Pi, `expires_at: 1795700977`, `protocol_version: 30`) on `CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV` (consumer `GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3`, provider `GA7UMIANNCXSZK5NQ7GCAWL3BP3GOBGVRHLSRYY5WI2KZG4SRFLZSARW`, lock signing tx `027c6256ca099440b764269778693af16776ef1559ec8e406e2467b363fea065`); after expiration, invoked `refund_funds --initiator` (signing tx `497998846181ba40d396d9dac880c34b9b17789b21495ffbaa5234cadf02336e`), verified native transfer of `100000` stroops back to consumer, and verified `status: 'Refunded'` |

- **Live P30 PQ Dispute Resolution (`ON_CHAIN_PQ`) (`DISP30_E2E_1795700656`):** `ON_CHAIN_PQ` (`RESOLVED_CONSUMER` -> `REFUNDED`) — Resolved `FAVOR_CONSUMER` on `CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV` via tx `60f391a38e2dd948970f32112b50dbd4aa558e0425915175ad2ef16ec1d645b0` (`pqAuth.nonce: '1'`, `amountStroops: '100000'`, `payoutTo: GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3`); `10` mBZR principal + `3750` mBZR (`75%` of `5000` mBZR loser bond) = `3760` mBZR `totalWinnerCreditMbzr`, `1250` mBZR (`25%`) `elderPoolTotalMbzr` (`rewardPerElderMbzr: 1250` for `participatingMajorityElders: 1`).

## 3. Maintenance Protocol for Escrow Changes

1. **Co-Update Spec & Code:** Update Section 1 whenever protocol version/parameters, vault contract IDs/WASM hashes or methods, timelock/bond rules, or `/api/vault` and `/api/escrow/*` routes change.
2. **Append Proof Rows:** Record `escrowId`, contract/API status, transaction hashes, settlement math, and `EscrowLock` / `DisputeRecord` states for each verified run.
3. **Tag & Clean Synthetic Fixtures:** Clearly label synthetic test escrows (`ESC_TEST_*`, `ESC_TIMELOCK_*`, `ESC_KNOX_*`) and prune test records after archiving proof entries when preparing clean environments.