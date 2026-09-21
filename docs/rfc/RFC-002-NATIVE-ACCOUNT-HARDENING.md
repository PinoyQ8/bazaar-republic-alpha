# RFC-002: Native Layer-1 Account Hardening & Sweeper Bot Mitigation

## Metadata
- **Initiative:** Project Bazaar
- **Application:** Bazaar Republic (bazaar-republic-alpha)
- **Author:** Bazaar Tech (@PinoyQ8)
- **Status:** Empirically Verified (Pi Testnet Protocol 28)
- **Target Platform:** Pi Network Mainnet & Testnet (Stellar Consensus Protocol Layer-1)
- **License:** Pi Open Source (PiOS)
- **Repository:** https://github.com/PinoyQ8/bazaar-republic-alpha

---

## 1. Executive Summary
Compromised 24-word passphrases allow automated bots to drain unlocked balances via sub-second mempool monitoring. Because Pi Network uses standard fixed minimum transaction fees without private mempools, latency competitions fail. This RFC specifies a consensus-level defense leveraging native Stellar Consensus Protocol (SCP) `SetOptions` operations to escalate thresholds to 2-of-2 multisig, blocking single-sig bots with `op_bad_auth` and permanently deprecating leaked keys.

---

## 2. Empirical Verification Telemetry (Pi Testnet Protocol 28)
- **Horizon Node:** `https://api.testnet.minepi.com`
- **Network Passphrase:** `Pi Testnet`
- **Funder Account:** `GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3`
- **Victim Account (Compromised):** `GBSB2TRCW2W3O435DQFEQ37T7S2HB5O77UX3QQA54J2W5UK2CM3ENU6N`
- **Isolated Guardian Key:** `GBROPBB3VV4BJ4ZHTMWFACDYVEK2ARMGEVLYGSB4NQUL5SJSWVDEDGV7`
- **Attacker Bot Target:** `GBECO3UJOCSTKGNAHH4HPPKOJ4YAM6RJL36QA5LJZATF7EY43IU7WXHD`
- **Safe Recovery Target:** `GC2EMMRBZ4XTUPBJ5TRLSPMOKPKTR377DCYH2YYEZJAK46UMXRWR3CNO`

### Verified On-Chain Transaction Audit Log:
1. **Step 1 (Defense SetOptions):**
   - **Tx Hash:** `69d173ed725ce6efb87d2bc074f40139d0d38f03e8929369dacea54f5d6c7e00`
   - **Configuration:** `masterWeight: 1`, `signerWeight: 1`, `low/med/highThreshold: 2`
2. **Step 2 (Sweeper Bot Blocked):**
   - **Transaction Result:** `tx_bad_auth`
   - **Operation Result:** `["op_bad_auth"]`
   - **Consensus Verification:** Single-sig bot (Weight 1) < Medium Threshold (2).
3. **Step 3 (Authorized 2-of-2 Multisig Sweep):**
   - **Tx Hash:** `b42e6f8c660f847ebb65498a7794bc3b4454c3c401ece6ccd05d1a4b0a6e1ed4`
   - **Outcome:** Assets transferred safely to the recovery vault.
4. **Step 4 (Permanent Master Key Revocation):**
   - **Tx Hash:** `c4cac6f1ba33e16e57558a794eb11c9261374e54778a19ecc04589d4f229dea9`
   - **Outcome:** `masterWeight = 0`. Leaked 24-word passphrase permanently deactivated on-chain.

---

## 3. Proposed Ecosystem Standards
1. **In-App Emergency Shield:** Add an emergency threshold escalation trigger inside the official Pi Browser Wallet.
2. **Pre-Migration Hardening:** Allow Pioneers with suspected passphrase leaks to escalate thresholds before token migration.
3. **CAP-0015 Fee-Bump Relays:** Standardize zero-gas inner payment sweeps sponsored by outer fee-bump accounts.
