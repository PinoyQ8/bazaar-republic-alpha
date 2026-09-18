import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  Address,
  BASE_FEE,
  Keypair,
  Operation,
  rpc as StellarRpc,
  SorobanDataBuilder,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";

const RPC_URL = (
  process.env.SOROBAN_RPC_URL || "https://rpc.testnet.minepi.com"
).trim().replace(/\/$/, "");

const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK_PASSPHRASE || "Pi Testnet";

const CONTRACT_ID =
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  "CAL7VDQBPLM4Z3LDG4TSALUL3DQAWZIJGWOLYQ3JBND3RJTZ7XLKEIUG";

const SAFETY_THRESHOLD_LEDGERS = 10_000;
const TARGET_EXTEND_TO_LEDGERS = 100_000;

async function rpcRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 3000): Promise<T> {
  for (let i = 1; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      if (i === retries) throw err;
      console.log(`⚠️ RPC fetch dropped (${err?.message || "fetch failed"}). Retrying ${i + 1}/${retries} in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("RPC request timed out after max retries");
}

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

  const latestLedger = await rpcRetry(() => server.getLatestLedger());
  const currentSeq = latestLedger.sequence;
  console.log(`📊 Current Network Ledger: ${currentSeq}`);

  const instanceKey = buildInstanceKey(CONTRACT_ID);
  const ledgerResponse = await rpcRetry(() => server.getLedgerEntries(instanceKey));
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

  const needsExtension = minRemainingTtl <= SAFETY_THRESHOLD_LEDGERS || entries.length === 0;

  if (needsExtension) {
    console.log(`⚡ Dispatching Footprint TTL Extension to +${TARGET_EXTEND_TO_LEDGERS} ledgers...`);

    const account = await rpcRetry(() => server.getAccount(keeper.publicKey()));
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

    tx = await rpcRetry(() => server.prepareTransaction(tx));
    tx.sign(keeper);

    const sendResponse = await rpcRetry(() => server.sendTransaction(tx));
    if (sendResponse.status === "ERROR") {
      throw new Error(`Transaction Rejected: ${JSON.stringify(sendResponse.errorResult)}`);
    }

    console.log(`⏳ Broadcasted successfully. Tx Hash: ${sendResponse.hash}`);

    let txStatus = await rpcRetry(() => server.getTransaction(sendResponse.hash));
    while (txStatus.status === StellarRpc.Api.GetTransactionStatus.NOT_FOUND) {
      await new Promise((r) => setTimeout(r, 2000));
      txStatus = await rpcRetry(() => server.getTransaction(sendResponse.hash));
    }

    if (txStatus.status === StellarRpc.Api.GetTransactionStatus.SUCCESS) {
      console.log(`✅ State TTL successfully bumped to +${TARGET_EXTEND_TO_LEDGERS} ledgers!`);
    } else {
      console.error("❌ Extension failed on ledger:", txStatus);
    }
  } else {
    console.log("✨ All monitored contract entries are within safe operational limits.");
  }
}

runTtlKeeper().catch((err) => {
  console.error("❌ [KEEPER Error]:", err.message || err);
  process.exit(1);
});
