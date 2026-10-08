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
Compromised 24-word passphrases allow automated bots to drain unlocked balances via sub-second mempool monitoring. Because Pi Network uses standard fixed minimum transaction fees without private mempools, latency competitions fail. This RFC specifies a consensus-level defense leveraging native Stellar Consensus Protocol (SCP) SetOptions operations to escalate thresholds to 2-of-2 multisig, blocking single-sig bots with op_bad_auth and permanently deprecating leaked keys.

---

## 2. Empirical Verification Telemetry (Pi Testnet Protocol 28)
- **Horizon Node:** `https://api.testnet.minepi.com`
- **Network Passphrase:** `Pi Testnet`
- **Deployer Account:** `GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3`
- **Victim Account (Compromised):** `GBATLIM5WHOJQ4NPHQCO4ZJ43UTNFYKG7CH3FBIV5IICO5PHKQSYTL6W`
- **Isolated Guardian Key:** `GAOFDO3GWBNVHBS7GXDKTDEODSWITUH6AFDHTP2S3ZKYRMW7QPUUP35T`
- **Attacker Bot Target:** `GBZE4BQYS2GNHHBPHUE4A6F2XU7H2ZKEBJHDJNUCTUTX6PES6C745OHS`
- **Safe Recovery Target:** `GBR36EUGWKE66RPYR6AE53625RTOH6MPXFSVN47CJLFIC2EWS7PUCBYO`

### Verified On-Chain Transaction Audit Log:
1. **Victim Initialization:**
   - **Tx Hash:** `ee522fec4e2b12de8f43fe617b80870f0d9e7218b7b299d2bf79bb7020610e75`
2. **Safe Vault Initialization:**
   - **Tx Hash:** `cc53492f66f2187ce789abec519567a0edd440ef8af31c79a3bf19987882ce6e`
3. **Step 1 (Defense SetOptions):**
   - **Tx Hash:** `b7984f98f69508fdab005b02f93cb0eb3b6f5c62e02fa6b7885c8c6f619937a0`
   - **Configuration:** `masterWeight: 1`, `signerWeight: 1`, `low/med/highThreshold: 2`
4. **Step 2 (Sweeper Bot Blocked):**
   - **Transaction Result:** `tx_bad_auth`
   - **Operation Result:** `["op_bad_auth"]`
   - **Consensus Verification:** Single-sig bot (Weight 1) < Medium Threshold (2).
5. **Step 3 (Authorized 2-of-2 Multisig Sweep):**
   - **Tx Hash:** `7d422f1cd1e768a46a5764d2c882e4cfa29776fba54185e2dff17e7d1f1b5d6c`
   - **Outcome:** Assets transferred safely to the recovery vault.
6. **Step 4 (Permanent Master Key Revocation):**
   - **Tx Hash:** `c2ed1582e55dfa8dc2695618ef745a69a123fc2a3327e54a6b397db69bce8906`
   - **Outcome:** `masterWeight = 0`. Leaked 24-word passphrase permanently deactivated on-chain.
