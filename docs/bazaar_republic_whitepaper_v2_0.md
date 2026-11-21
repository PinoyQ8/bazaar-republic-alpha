# Project Bazaar: Bazaar Republic Whitepaper v2.0
**Canonical Protocol, Dual-Token Economy & Constitutional Autonomous Governance Specification**

* **Application Identifier:** `PinoyQ8/bazaar-republic-alpha`
* **License & Ecosystem:** Pi Open Source (`PiOS`) — Built natively on Pi Network & Stellar/Soroban Protocol 28
* **Working Group:** Solo Human Founder & Architect (`PinoyQ8`) + AI Co-Developer (`Bazaar Tech`)

---

## I. Executive Mandate & Vision
Project Bazaar (**Bazaar Republic**) reclaims compute and commercial sovereignty by transforming everyday Pi Pioneers from passive platform consumers into active infrastructure maintainers. Built natively for mobile Pi Browser viewports ($384 \times 854$) and decentralized desktop hardware (`SoloHost`), the Republic combines gasless Layer-2 state channels, non-custodial Soroban escrow vaults, biometric passkey security, and constitutional autonomous DAO governance into a self-sustaining E-Network marketplace.

---

## II. Three-Tier Protocol Architecture
Bazaar Republic separates domain policy, cryptographic governance, and base-layer settlement across three distinct protocol tiers:

1. **Tier 1 — Operational & Domain Layer (`The Neo Protocol`):** Governs the overarching E-Network marketplace rules, merchant and consumer operational manuals, and the constitutional DAO framework.
2. **Tier 2 — Security & Governance Engine (`The MESH Protocol`):** Enforces the 5-chamber governance matrix, the Tri-State Constitutional Adjudicator, rolling **$92\%$ Uptime Shield** telemetry ($90\%$ hard SLA floor; $85\%$ suspension trigger), off-chain state synchronization (`bzr-db` MongoDB replica set), Zero-Knowledge verifier circuits, and the 5-Elder VRF dispute pipeline.
3. **Tier 3 — Execution & On-Chain Consensus (`Pi Network & Soroban Protocol 28`):** Handles base-layer Pi ($\Pi$) settlement and WASM smart contracts (`bazaar_vault.wasm`, `bazaar_beacon.wasm`), leveraging **CAP-0071** biometric passkey delegation, **CAP-0085** atomic Beacon fleet upgrades, and **CAP-0086** sparse map lazy migrations.

---

## III. Canonical Dual Tokenomics ($\Pi \leftrightarrow m\text{BZR}$)
Bazaar Republic operates a strict two-asset monetary architecture. Legacy standalone `BZR` tickers and early `1mg Synthetic Gold` calibration metadata are permanently retired.

| Asset Parameter | Native Pi ($\Pi$) — Layer 1 | $m\text{BZR}$ (Micro-Bazaar) — Layer 2 |
| :--- | :--- | :--- |
| **Network Layer** | Pi Blockchain / Soroban Vaults | MESH State Channel Engine & Soroban SAC |
| **Monetary Role** | Retail checkout, L1 escrow principal, vault collateral, payment service fees | Internal synthetic utility credit, merchant platform fees, DePIN staking, dispute bonds |
| **Supply Cap** | Pi Network Layer-1 emission schedule | Hard-capped at **$1,000,000,000\text{ }m\text{BZR}$** ($100\%$ collateralized) |
| **Transaction Cost** | Standard L1 ledger fee | **Zero gas** on off-chain MESH state updates |

### 1. Immutable Synthetic Peg & Solvency Invariant
* **Fixed Conversion Peg:** **$1.0000000\text{ }\Pi = 1,000.0000000\text{ }m\text{BZR}$**, enforced strictly in 7-decimal `BigInt` stroop integer arithmetic ($1\text{ }\Pi = 10,000,000\text{ stroops}$; $1\text{ }m\text{BZR} = 10,000\text{ stroops} = 0.001\text{ }\Pi$; precision $10^7$).
* **100% Reserve Backing ($CR \ge 1.0$):** Every circulating $m\text{BZR}$ is backed by native $\Pi$ locked in non-custodial Layer-1 vaults (`bazaar-vault`), enforcing:
  $$CR = \frac{V_{\text{collateral}} \times 1,000}{M_{\text{circulating}}} \ge 1.0$$
  up to $1,000,000\text{ }\Pi$ vaulted at the full $1,000,000,000\text{ }m\text{BZR}$ supply ceiling.

### 2. Tier-Tranched $1,000\text{ }\Pi$ Lifetime Rollout & Dynamic Swap Quotas
Governance tier and active DAO participation never alter the immutable $1:1,000$ conversion rate. Instead, they govern each Pioneer's progressive lifetime mint ladder ($1,000\text{ }\Pi$ ceiling), per-epoch swap quotas, and fee rebates:

| Passport Tier | Cumulative Lifetime Cap ($L_{\text{tier}}$) | Base Epoch Velocity ($Q_{\text{base}}$) | Swap Quota & Fee Rebate Mechanics |
| :--- | :--- | :--- | :--- |
| **`OBSERVER`** *(Unverified)* | $0\text{ }\Pi$ | $0\text{ }\Pi$ | Locked until Pi KYC/Auth and Academy Module 00 clear. |
| **`CITIZEN`** *(Tier 1)* | $100\text{ }\Pi$ ($100\text{k }m\text{BZR}$) | $25\text{ }\Pi$ / epoch | $1.0\times$ tier baseline; active voting ($P_{\text{gov}}$) scales quota up to $3.0\times$ via Composite Model C ($45\%$ Tier / $55\%$ Participation). |
| **`NOVICE`** *(Tier 2)* | $250\text{ }\Pi$ ($250\text{k }m\text{BZR}$) | $50\text{ }\Pi$ / epoch | $1.5\times$ tier multiplier; $10\%$ base fee discount; requires Module 01 + TrustScore $\ge 60$. |
| **`ACADEMY_CORE` / `MERCHANT`** *(Tier 3)* | $500\text{ }\Pi$ ($500\text{k }m\text{BZR}$) | $100\text{ }\Pi$ / epoch | $2.5\times$ tier multiplier; $25\%$ base fee discount; requires Modules 01–02 + TrustScore $\ge 75$ + Stake $\ge 15\text{ }\Pi$. |
| **`MESH_GUARDIAN`** *(Tier 4)* | $750\text{ }\Pi$ ($750\text{k }m\text{BZR}$) | $150\text{ }\Pi$ / epoch | $4.0\times$ tier multiplier; $50\%$ base fee discount; requires $\ge 92\%$ Uptime Shield + $10,000\text{ }m\text{BZR}$ PoCS stake. |
| **`GENESIS_100` & `FOUNDER`** *(Tiers 5–6)* | $1,000\text{ }\Pi$ ($1\text{M }m\text{BZR}$) | $250\text{ }\Pi$ / epoch | $10.0\times$ tier multiplier; $100\%$ protocol rebalancing waiver; requires Modules 01–03 + TrustScore $\ge 85$. |

* **Protocol Fee Routing:** Standard $\Pi \to m\text{BZR}$ conversions incur a $0.30\%$ base fee (before tier/participation rebates), routed **$70\%$** to active SoloHost DePIN Node Yield and **$30\%$** to DAO Protocol-Owned Liquidity (POL). Redemptions ($m\text{BZR} \to \Pi$) incur a $0.50\%$ exit tariff routed to Layer-1 Soroban paymaster reserves.
* **Wholesale Corridor & Restricted Categories:** Open Standard (`OUSD`) is isolated strictly to eligible Phase 2/3 B2B wholesale Cost of Goods Sold (COGS) hedging ($1.0\text{ }m\text{BZR} = 0.001 \times P_{\Pi}\text{ OUSD}$) with escrow float yield recycled to the DAO Treasury. EEA/sanctioned jurisdictions and restricted retail categories (jewelry, watches, luxury goods, precious metals) settle exclusively in native $\Pi$.

---

## IV. Trustless Security, Escrow & Justice
1. **Seedless Biometric Enclaves & Sweeper Defense:** WebAuthn and hardware enclaves (Samsung Knox / Apple Secure Enclave via CAP-0071) eliminate raw seed phrases, paired with RFC-002 consensus-level `SetOptions` multi-sig hardening (`op_bad_auth` automated sweeper defense).
2. **48-Hour Non-Custodial Escrows:** Smart contracts lock funds atomically upon order creation and enforce deterministic 48-hour fulfillment windows with trustless buyer refund clawbacks.
3. **5-Elder VRF Dispute Arbitration ($75/25$ Schelling Split):** Contested escrows trigger a Verifiable Random Function (VRF) to draw **5 impartial `GENESIS_ELDER` operators** ($3\text{-of-}5$ majority quorum). The prevailing party recovers **$100\%$ of escrow principal**, while the losing party's forfeited $m\text{BZR}$ security bond splits **$75\%$** to the winning participant and **$25\%$** equally among majority-voting Elders.

---

## V. Constitutional & Autonomous DAO Governance
Bazaar Republic prevents whale or cartel capture through **Segregation of Duties (SoD)** across **5 Macro Constitutional Chambers**, each capped at an equal **$20\%$ global voting weight**. Chamber-local operational proposals pass internally within one chamber; cross-chamber constitutional or fiscal proposals require **$\ge 80\%$ global consensus ($4\text{ of }5$ chambers)**. All ballots execute gaslessly off-chain via Soulbound TrustScore badges ($0.00\text{ }\Pi$ gas).

### 1. The Five Constitutional Chambers & Common-Good Mandates

| Constitutional Chamber ($20\%$ Cap) | Constituent Passport Tiers | Internal Quorum & Threshold | Permitted Proposal Scope & Common-Good Contribution |
| :--- | :--- | :--- | :--- |
| **1. `FOUNDER`** | Active `BAZAAR_FOUNDER` $\to$ Post-Succession `FOUNDER_DESCENDANT` | **$100\%$** (Active Founder) / **$\ge 80\%$** (Descendants) | Constitutional oversight, emergency exploit freezes, Heir Succession continuity, and the **72-hour "Hold & Modify" Soft Veto**. *(Descendants remain dormant at $0\%$ while Founder is active.)* |
| **2. `GENESIS_100`** | `GENESIS_100` Cohort *(includes `GENESIS_ELDER`)* | Genesis Quorum + $\ge 80\%$ approval; **$3\text{-of-}5$ VRF** for panels | Core Soroban WASM upgrades, treasury stewardship, 5-Elder VRF dispute adjudication, and borderline constitutional clarification. |
| **3. `MERCHANT`** | `ECO_DEVELOPER` / `ACADEMY_CORE` | **$51\%$** Simple Majority + $\ge 80\%$ approval | Marketplace standards, merchant vouching collateral, AMM liquidity, and trade/service tax calibrations—generating the fiscal inflows that sustain the Republic. |
| **4. `SERVICE_PROVIDER`** | `MESH_VALIDATOR` / `MESH_GUARDIAN` | **$75\%$** Supermajority + $\ge 80\%$ approval | SoloHost Docker/RPC relays (`31400–31409`), `ExtendFootprintTTLOp` state keepers, and maintaining the **$92\%$ Uptime Shield** DePIN backbone. |
| **5. `CITIZEN`** | `CITIZEN` / `NOVICE` | **$20\%$** Caucus Floor + $\ge 80\%$ approval | Consumer protection norms, Academy feedback, and **Republic Shield Mutual Aid** disbursements. *(Unverified `OBSERVER` accounts hold $0\%$ voting and proposal rights.)* |

### 2. End-to-End Legislative & Autonomous Execution Pipeline

```
[Draft + Stake] --> [1. Dual-Layer Cooldown Gate]
                            |
                            v
               [2. Tri-State MESH Adjudicator]
                 /          |              \
     (HARD_BLOCKED)    (BORDERLINE)     (APPROVED)
           |                |                |
           v                v                v
      [REJECTED]     [5-Elder VRF 24h]   [ACTIVE 7d Ballot]
       + Article       (3-of-5 Rule)         |
        Citation        /        \           v
                   (Reject)    (Clear) --> [PASSED (>= 80%)]
                                             |
                                             v
                              [3. 5-Pillar Vision Alignment Audit]
                                 /                          \
                       (< 100% Alignment)            (100% Aligned)
                                |                            |
                                v                            v
                 [4. HOLD_AND_MODIFY (72h SLA)]    [AUTONOMOUS EXECUTION]
                   /       |         |       \       Atomic $transaction
             (Override) (Modify)  (Veto)  (Timeout)  Status -> EXECUTED
                |          |         |        |
                v          v         v        v
            EXECUTED  Re-Ballot  REJECTED  EXPIRED
                       (48h)
```

1. **Dual-Layer Proposal Cooldown Gate:** Authors face tier-scaled individual cooldowns (`CITIZEN` 14d, `NOVICE` 10d, `ACADEMY_CORE` 7d, `MESH_GUARDIAN` 5d, `GENESIS_100` 3d, `FOUNDER` 24h) multiplied by prior outcomes ($1.0\times$ ratified, $1.5\times$ defeated, $2.0\times$ Elder-rejected, $3.0\times$ plus $+7$ escalating strike days per consecutive hard-block), alongside chamber concurrent ballot caps (`CITIZEN` 3, `MERCHANT` 4, `SERVICE_PROVIDER` 4, `GENESIS` 5, `FOUNDER` 2) and same-parameter lockouts ($7\text{--}30\text{ days}$).
2. **Pre-Ballot Tri-State MESH Constitutional Adjudicator:** Before a ballot opens, the MESH Adjudicator scans the draft against the **Five Constitutional Articles** (Article I: Civic Standing & Chamber Jurisdiction; Article II: $20\%$ Chamber Parity; Article III: $1:1,000$ Peg & $1\text{B}$ Supply Invariants; Article IV: Justice & Succession Shields; Article V: Quantitative Safety Bounds):
   * **`APPROVED` (`ACTIVE`):** Clean drafts receive a SHA-256 `adjudicatorSealHash` and open for a **7-day ballot**.
   * **`HARD_BLOCKED` (`REJECTED`):** Clear constitutional violations are permanently blocked with an explicit article-by-article violation explanation.
   * **`BORDERLINE_ESCALATED` (`ELDER_REVIEW`):** Unstructured policy text, edge-zone values (within $5\%$ of bounds), or cross-chamber fiscal spillovers route to a **5-Elder VRF Clarification Panel** (24-hour window; $3\text{-of-}5$ binary ruling to clear to `ACTIVE` or reject to `REJECTED`).
3. **Post-Passage 5-Pillar Vision Audit & Autonomous Implementation:** When a ballot passes ($\ge 80\%$ ratification), the MESH Adjudicator re-verifies ballot collision integrity and scores the proposal against the **Five Founder Vision Pillars** ($20\text{ pts}$ each = $100\%$: Compute Sovereignty & DePIN Grid, Non-Custodial Trustlessness, Monetary & Pi Parity, Anti-Capture Chamber Parity, and Institutional Continuity):
   * **$100\%$ Vision-Aligned:** The MESH Adjudicator **autonomously implements** the parameter update via an atomic Prisma `$transaction` and on-chain dispatch without manual bottlenecks (`EXECUTED`).
   * **$< 100\%$ Vision-Aligned (`HOLD_AND_MODIFY`):** Execution pauses and routes to Chamber 1 (`FOUNDER`) for a strict **72-hour decision window**.
4. **72-Hour "Hold & Modify" Soft Veto SLA:** Within 72 hours, Chamber 1 must sign a public rationale ($\ge 15\text{ chars}$) to:
   * **`APPROVE_OVERRIDE`:** Immediately commit the proposal (`EXECUTED`).
   * **`MODIFY_AND_RESUBMIT`:** Publish redlines and re-open a **48-hour collaborative ratification ballot** (`ACTIVE`).
   * **`SOFT_VETO`:** Reject with explicit constitutional justification (`REJECTED`) and refund voter stakes.
   * **Automated `EXPIRED` Fallback:** If 72 hours elapse without a Chamber 1 ruling, the MESH keeper automatically transitions the proposal to `EXPIRED` and refunds voter stakes—preventing silent pocket-vetoes.
5. **Heir Succession Protocol (`RepublicHeirSuccession`):** Voluntary retirement or a **90-day inactivity dead-man's switch** ($+14\text{-day}$ grace period and Shamir's Secret Sharing) transfers Chamber 1 authority from the Founder ($100\%$) to verified Founder Descendants ($\ge 80\%$ internal weighted consensus).

---

## VI. Three-Phase Rollout Roadmap
* **Phase 1 — Alpha (Current Genesis Sandbox):** Deployed on Pi Testnet with Soroban Protocol 28 vaults, `bzr-db` MongoDB replica set (Schema v2.7.2), RFC-002 sweeper defense, and SoloHost Genesis 100 onboarding (`PinoyQ8/bazaar-republic-alpha`).
* **Phase 2 — Beta (Ecosystem Expansion):** Public SoloHost Discover rollout, CAP-0085 Beacon fleet upgrades & CAP-0086 sparse maps, live Samsung Knox biometric passkey escrows, and full 5-Elder VRF Schelling dispute resolution.
* **Phase 3 — Full Release (Sovereign Mainnet):** Pi Open Network cutover, sovereign L1-failover readiness, full `RepublicHeirSuccession` activation, and institutional B2B OUSD wholesale restock rails.