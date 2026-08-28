import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
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

// 1. Manually parse .env.local and .env
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
  process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org"
).trim().replace(/\/$/, "");

const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

const CONTRACT_ID =
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  "CCLEEATNMEUZGVSYL4NSZYADVCAPU2EFCJNCNV77KVOUDFO3CGM3SKKL";

const TARGET_EXTEND_TO_LEDGERS = 100_000; // ~5.7 days of ledger runway

function resolveKeeperKey(): Keypair {
  const envSeed = (
    process.env.KEEPER_SIGNER_SECRET ||
    process.env.STELLAR_VAULT_SEED ||
    process.env.STELLAR_DEPLOYER_SECRET ||
    ""
  ).trim();

  if (envSeed && envSeed.startsWith("S") && envSeed.length === 56) {
    try {
      return Keypair.fromSecret(envSeed);
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

async function runTtlKeeper() {
  console.log("🤖 [KEEPER-BOT] Initializing Soroban State TTL Sentinel...");

  const keeper = resolveKeeperKey();
  console.log(`🔌 Target Vault Contract : ${CONTRACT_ID}`);
  console.log(`🔑 Keeper Signer Address : ${keeper.publicKey()}`);
  console.log(`📡 Target RPC URL        : ${RPC_URL}`);

  const server = new StellarRpc.Server(RPC_URL, {
    allowHttp: RPC_URL.startsWith("http://"),
  });

  const latestLedger = await server.getLatestLedger();
  const currentSeq = latestLedger.sequence;
  console.log(`📊 Current Network Ledger: ${currentSeq}`);

  const instanceKey = buildInstanceKey(CONTRACT_ID);
  const ledgerResponse = await server.getLedgerEntries(instanceKey);
  const entries = ledgerResponse.entries ?? [];

  let minRemainingTtl = Infinity;
  for (const entry of entries) {
    const liveUntil = entry.liveUntilLedgerSeq ?? 0;
    const remaining = liveUntil > currentSeq ? liveUntil - currentSeq : 0;
    if (remaining < minRemainingTtl) minRemainingTtl = remaining;
  }

  console.log(
    `🔍 Vault Instance TTL: ${
      minRemainingTtl === Infinity ? "Unextended" : `${minRemainingTtl} ledgers`
    }`
  );

  console.log(`⚡ Dispatching Footprint TTL Extension to +${TARGET_EXTEND_TO_LEDGERS} ledgers...`);

  const account = await server.getAccount(keeper.publicKey());
  const readOnlyFootprint: xdr.LedgerKey[] = [instanceKey];

  if (entries.length > 0 && entries[0].val) {
    try {
      const entryVal: any = entries[0].val;
      const ledgerEntryData =
        typeof entryVal === "string" || Buffer.isBuffer(entryVal)
          ? xdr.LedgerEntryData.fromXDR(entryVal as any, "base64")
          : (entryVal as xdr.LedgerEntryData);
      const contractData = ledgerEntryData.contractData();
      const instance = contractData.val().instance();
      const wasmHash = instance.executable().wasmHash();
      if (wasmHash) {
        readOnlyFootprint.push(
          xdr.LedgerKey.contractCode(
            new xdr.LedgerKeyContractCode({ hash: wasmHash })
          )
        );
      }
    } catch {}
  }

  const sorobanData = new SorobanDataBuilder()
    .setReadOnly(readOnlyFootprint)
    .build();

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
    throw new Error(`Transaction Rejected: ${JSON.stringify(sendResponse.errorResult)}`);
  }

  console.log(`⏳ Broadcasted successfully. Tx Hash: ${sendResponse.hash}`);

  let txStatus = await server.getTransaction(sendResponse.hash);
  while (txStatus.status === StellarRpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 1500));
    txStatus = await server.getTransaction(sendResponse.hash);
  }

  if (txStatus.status === StellarRpc.Api.GetTransactionStatus.SUCCESS) {
    console.log(`✅ State TTL successfully bumped to +${TARGET_EXTEND_TO_LEDGERS} ledgers!`);
  } else {
    console.error("❌ Extension failed:", txStatus);
  }
}

const POLLING_INTERVAL_MS = 60 * 60 * 1000; // 1 Hour
runTtlKeeper().catch((err) => console.error("❌ [KEEPER Error]:", err.message || err));
setInterval(() => {
  runTtlKeeper().catch((err) => console.error("❌ [KEEPER Error]:", err.message || err));
}, POLLING_INTERVAL_MS);((err) => {
  console.error("❌ [KEEPER Error]:", err.message || err);
  process.exit(1);
});

