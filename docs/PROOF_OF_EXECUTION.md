# Project Bazaar — Proof of Execution & Verification Log

- **Contract Address:** `CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV`
- **Token Contract:** `CDG6ZM2SHXIHD5HZ2E62B7D76RY5DUHDNQVPSHRVDNN7W4EW47FXLEXQ`
- **Test Amount:** `10000000` stroops (`1.0` PI)

## Verified End-to-End Runs (`scripts/setup-pq30-dispute.ts` + `POST /api/escrow/dispute/resolve`)

### 1. `PQ30_03` — `FAVOR_MERCHANT` (`nonce: 1`)
- **Lock Tx:** `7ec81251f4959dd6b5bcd01fd8489d08a1a5b0750a13acaa437334dbcd8f5c21`
- **Dispute Tx:** `619e4638e19a59cefb3ec217eabf6282e744058a06b9ee94041bb4db3252d316`
- **PQ Resolution Tx:** `bb725b1649553c50e37802c637e3969191b65aebd35152e28d7cb8e5a1d4cc2d`
- **Result:** HTTP `200`, `settlementMode: "ON_CHAIN_PQ"`, `escrowStatus: "RELEASED"`, `winningOutcome: "RESOLVED_MERCHANT"`, `pqAuth.nonce: "1"`, `pqAuth.amountStroops: "10000000"`

### 2. `PQ30_04` — `FAVOR_MERCHANT` (`nonce: 1`)
- **Lock Tx:** `af7e2e5029957fdbd5a25df7c10c4214d1a530ca5a8a9f148828ad5072f2229d`
- **Dispute Tx:** `06a83e5e072eeab122106b4c6508f581431cf356c085ddc5d308823d3e4a2007`
- **PQ Resolution Tx:** `8f0b2f93f35cb0f19dca1ac57337fd526fd616291d7559d275e0c493524d5448`
- **Result:** HTTP `200`, `settlementMode: "ON_CHAIN_PQ"`, `escrowStatus: "RELEASED"`, `winningOutcome: "RESOLVED_MERCHANT"`, `pqAuth.nonce: "1"`, `pqAuth.amountStroops: "10000000"`

### 3. `PQ30_05` — `FAVOR_CONSUMER` (`nonce: 1`)
- **Lock Tx:** `a53fb70148b2e88e68405bbe3eb19d42d28d07c1e813e59cb5babec2e887a512`
- **Dispute Tx:** `0035826ceb0af59441f1dfb52876a84aa00164fb81bafd37e275b2a887d060c1`
- **PQ Resolution Tx:** `8544a18d22333f7a5164fe783013c8df69e1208b72cb439f7a8d47260fe2186f`
- **Result:** HTTP `200`, `settlementMode: "ON_CHAIN_PQ"`, `escrowStatus: "REFUNDED"`, `winningOutcome: "RESOLVED_CONSUMER"`, `pqAuth.nonce: "1"`, `pqAuth.amountStroops: "10000000"`

### 4. `PQ30_06` — `FAVOR_MERCHANT` (`nonce: 2`)
- **Lock Tx:** `273e9923ed83e99d434bac15ddd56ba65b172187828abdd6c1d819f2c9699904`
- **Dispute Tx:** `8355bd26649502fa23c23c93f081a253a58c6d5a3b166a3aa92c5f3bc121fb50`
- **PQ Resolution Tx:** `34089cbc7cfb18824245ef7de3c8b678fba4f2b34edafcea93417e813dbb6fae`
- **Result:** HTTP `200`, `settlementMode: "ON_CHAIN_PQ"`, `escrowStatus: "RELEASED"`, `winningOutcome: "RESOLVED_MERCHANT"`, `pqAuth.nonce: "2"`, `pqAuth.amountStroops: "10000000"`
