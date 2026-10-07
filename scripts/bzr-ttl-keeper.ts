import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import {
  Address,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  rpc as StellarRpc,
  SorobanDataBuilder,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 1. Synchronize environment configuration
for (const file of [".env.local", ".env"]) {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    const lines = fs.readFileSync(fullPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || "").trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

const RPC_URL = (
  process.env.SOROBAN_RPC_URL ||
  process.env.NEXT_PUBLIC_PI_RPC_URL ||
  "https://rpc.testnet.minepi.com"
).trim().replace(/\/$/, "");

const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK_PASSPHRASE ||
  process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE ||
  "Pi Testnet";

const CONTRACT_ID =
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID ||
  "CBM5SVJHLHNAEUR4GA3IV5KZFPCCMGTZGMAJUNURUQIEFPTKZLKXQ3RY";

const SAFETY_THRESHOLD_LEDGERS = 50_000;
const TARGET_EXTEND_TO_LEDGERS = 100_000; // ~5.7 days of runway
const POLL_INTERVAL_MS = 60 * 60 * 1000; // Hourly check

function resolveSigner(): Keypair {
  const envKey = (
    process.env.KEEPER_SIGNER_SECRET ||
    process.env.STELLAR_VAULT_SEED ||
    process.env.STELLAR_DEPLOYER_SECRET ||
    ""
  ).trim();

  if (envKey.startsWith("S") && envKey.length === 56) {
    try {
      return Keypair.fromSecret(envKey);
    } catch {}
  }

  try {
    const cliOutput = execSync("stellar keys secret s23-deployer", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const match = cliOutput.match(/S[A-Z2-7]{55}/);
    if (match) return Keypair.fromSecret(match[0]);
  } catch {}

  throw new Error("Unable to resolve valid 56-character secret key for Keeper daemon.");
}

function buildInstanceKey(contractId: string): xdr.LedgerKey {
  return xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: Address.fromString(contractId).toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent(),
    })
  );
}

async function checkAndExtendTTL() {
  console.log(`\n[${new Date().toISOString()}] 🛡️ [SENTINEL-SWEEP] Probing state leases for ${CONTRACT_ID}...`);
  try {
    const keeper = resolveSigner();
    const server = new StellarRpc.Server(RPC_URL, {
      allowHttp: RPC_URL.startsWith("http://"),
    });

    const latestLedger = await server.getLatestLedger();
    const currentSeq = latestLedger.sequence;
    console.log(`📡 Current Network Ledger : ${currentSeq}`);

    const instanceKey = buildInstanceKey(CONTRACT_ID);
    const ledgerResponse = await server.getLedgerEntries(instanceKey);
    const entries = ledgerResponse.entries ?? [];

    if (entries.length === 0) {
      console.warn("⚠️ Contract instance entry not found on ledger.");
      return;
    }

    let minRemaining = Infinity;
    for (const entry of entries) {
      const liveUntil = entry.liveUntilLedgerSeq ?? 0;
      const remaining = liveUntil > currentSeq ? liveUntil - currentSeq : 0;
      if (remaining < minRemaining) minRemaining = remaining;
    }

    console.log(`📊 Vault Instance Lease   : Remaining TTL = ${minRemaining} ledgers`);

    if (minRemaining <= SAFETY_THRESHOLD_LEDGERS) {
      console.log(`⚡ TTL below threshold (${SAFETY_THRESHOLD_LEDGERS}). Assembling footprint extension...`);

      const account = await server.getAccount(keeper.publicKey());
      const readOnlyFootprint: xdr.LedgerKey[] = [instanceKey];

      // Extract and append WASM bytecode key to protect from code archival
      if (entries[0].val) {
        try {
          const entryVal: any = entries[0].val;
          const ledgerEntryData =
            typeof entryVal === "string" || Buffer.isBuffer(entryVal)
              ? xdr.LedgerEntryData.fromXDR(entryVal as any, "base64")
              : (entryVal as xdr.LedgerEntryData);
          const wasmHash = ledgerEntryData.contractData().val().instance().executable().wasmHash();
          if (wasmHash) {
            readOnlyFootprint.push(
              xdr.LedgerKey.contractCode(
                new xdr.LedgerKeyContractCode({ hash: wasmHash })
              )
            );
          }
        } catch {}
      }

      const sorobanData = new SorobanDataBuilder().setReadOnly(readOnlyFootprint).build();

      let tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .setSorobanData(sorobanData)
        .addOperation(
          Operation.extendFootprintTtl({
            extendTo: TARGET_EXTEND_TO_LEDGERS,
          })
        )
        .setTimeout(30)
        .build();

      tx = await server.prepareTransaction(tx);
      tx.sign(keeper);

      const sendResponse = await server.sendTransaction(tx);
      if (sendResponse.status === "ERROR") {
        throw new Error(`Consensus Rejection: ${JSON.stringify(sendResponse.errorResult)}`);
      }

      console.log(`⏳ Broadcasted extension. Tx Hash: ${sendResponse.hash}`);

      let txStatus = await server.getTransaction(sendResponse.hash);
      while (txStatus.status === StellarRpc.Api.GetTransactionStatus.NOT_FOUND) {
        await new Promise((r) => setTimeout(r, 1500));
        txStatus = await server.getTransaction(sendResponse.hash);
      }

      if (txStatus.status === StellarRpc.Api.GetTransactionStatus.SUCCESS) {
        console.log(`✅ State TTL successfully bumped to +${TARGET_EXTEND_TO_LEDGERS} ledgers!`);
      } else {
        console.error("❌ Extension inclusion failed:", txStatus);
      }
    } else {
      console.log(`✨ [HEALTHY] TTL is well above threshold. No extension required.`);
    }
  } catch (err: any) {
    console.error("❌ [KEEPER-FAULT]:", err.message || err);
  }
}

checkAndExtendTTL();
setInterval(checkAndExtendTTL, POLL_INTERVAL_MS);
