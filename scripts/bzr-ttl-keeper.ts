import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { execSync } from "child_process";
import {
  Address,
  Keypair,
  Operation,
  rpc as StellarRpc,
  SorobanDataBuilder,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";

const PI_RPC_URL = (
  process.env.NEXT_PUBLIC_PI_RPC_URL ||
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
  process.env.SOROBAN_RPC_URL ||
  "https://rpc.testnet.minepi.com"
).trim();

const CONTRACT_ID = (
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  process.env.BAZAAR_VAULT_CONTRACT_ID ||
  "CBM5SVJHLHNAEUR4GA3IV5KZFPCCMGTZGMAJUNURUQIEFPTKZLKXQ3RY"
).trim();

const NETWORK_PASSPHRASE = (
  process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE ||
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
  process.env.STELLAR_NETWORK_PASSPHRASE ||
  "Pi Testnet"
).trim();

const secret = (
  process.env.STELLAR_VAULT_SEED ||
  process.env.KEEPER_SIGNER_SECRET ||
  process.env.STELLAR_DEPLOYER_SECRET ||
  ""
).trim();

if (!secret || !secret.startsWith("S") || secret.length !== 56) {
  console.error("❌ Invalid secret key. Set STELLAR_VAULT_SEED or KEEPER_SIGNER_SECRET.");
  process.exit(1);
}

const keeperKey = Keypair.fromSecret(secret);
const server = new StellarRpc.Server(PI_RPC_URL, {
  allowHttp: PI_RPC_URL.startsWith("http://"),
});

const SAFETY_THRESHOLD_LEDGERS = 10_000;
const EXTEND_DELTA_LEDGERS = 100_000;
const POLL_INTERVAL_MS = 30 * 60 * 1000; // Every 30 minutes

function getPersistentDurability(): xdr.ContractDataDurability {
  const Ctor: any = xdr.ContractDataDurability;
  if (typeof Ctor?.persistent === "function") {
    try {
      return Ctor.persistent();
    } catch {
      // Fallback to constructor/constant checks
    }
  }
  if (Ctor?.persistent instanceof Ctor) {
    return Ctor.persistent;
  }
  if (typeof Ctor?.persistent === "number") {
    return new Ctor(Ctor.persistent);
  }
  return new Ctor(1);
}

function buildInstanceKey(contractId: string): xdr.LedgerKey {
  return xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: Address.fromString(contractId).toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: getPersistentDurability(),
    })
  );
}

function extendViaCli(currentSeq: number): void {
  const targetLedger = currentSeq + EXTEND_DELTA_LEDGERS;
  const cmd = [
    "stellar contract extend",
    `--id ${CONTRACT_ID}`,
    `--ledgers-to-extend ${EXTEND_DELTA_LEDGERS}`,
    "--source-account s23-deployer",
    `--rpc-url "${PI_RPC_URL}"`,
    `--network-passphrase "${NETWORK_PASSPHRASE}"`,
    "--inclusion-fee 10000000",
  ].join(" ");

  console.log(`⚡ [KEEPER] Extending lease toward ledger ~${targetLedger} via Pi Testnet CLI...`);
  const out = execSync(cmd, { encoding: "utf8" });
  console.log(`✅ [KEEPER] CLI TTL extension output:\n${out.trim()}`);
}

async function checkAndExtendTTL(): Promise<void> {
  console.log(
    `\n🛡️ [BZR TTL KEEPER] Polling state leases for ${CONTRACT_ID} on ${NETWORK_PASSPHRASE} (${PI_RPC_URL})...`
  );

  const latestLedger = await server.getLatestLedger();
  const currentSeq = latestLedger.sequence;
  console.log(`📡 [KEEPER] Signer Account: ${keeperKey.publicKey()}`);
  console.log(`📡 [KEEPER] Current Ledger: ${currentSeq}`);

  const instanceKey = buildInstanceKey(CONTRACT_ID);
  const ledgerResponse = await server.getLedgerEntries(instanceKey);
  const entries = ledgerResponse.entries ?? [];

  let minRemainingTtl = Infinity;
  const readOnlyFootprint: xdr.LedgerKey[] = [instanceKey];

  for (const entry of entries) {
    const liveUntil = entry.liveUntilLedgerSeq ?? 0;
    const remaining = liveUntil > currentSeq ? liveUntil - currentSeq : 0;
    if (remaining < minRemainingTtl) {
      minRemainingTtl = remaining;
    }

    if (entry.val) {
      try {
        const entryVal: any = entry.val;
        const ledgerEntryData =
          typeof entryVal === "string" || Buffer.isBuffer(entryVal)
            ? xdr.LedgerEntryData.fromXDR(entryVal as any, "base64")
            : (entryVal as xdr.LedgerEntryData);

        const instance = ledgerEntryData.contractData().val().instance();
        const executable = instance.executable();
        if (executable.switch().name === "contractExecutableWasm") {
          const wasmHash = executable.wasmHash();
          if (wasmHash) {
            readOnlyFootprint.push(
              xdr.LedgerKey.contractCode(
                new xdr.LedgerKeyContractCode({ hash: wasmHash })
              )
            );
          }
        }
      } catch {
        // Ignore non-WASM or pre-decoded entries
      }
    }
  }

  console.log(
    `🔍 [KEEPER] Vault Remaining TTL: ${
      minRemainingTtl === Infinity ? "Unextended / Active" : `${minRemainingTtl} ledgers`
    }`
  );

  if (minRemainingTtl <= SAFETY_THRESHOLD_LEDGERS || entries.length === 0) {
    try {
      const account = await server.getAccount(keeperKey.publicKey());
      const sorobanData = new SorobanDataBuilder()
        .setReadOnly(readOnlyFootprint)
        .build();

      const rawTx = new TransactionBuilder(account, {
        fee: "10000000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .setSorobanData(sorobanData)
        .addOperation(
          Operation.extendFootprintTtl({
            extendTo: currentSeq + EXTEND_DELTA_LEDGERS,
          })
        )
        .setTimeout(30)
        .build();

      const preparedTx = await server.prepareTransaction(rawTx, NETWORK_PASSPHRASE);
      const txToSign = TransactionBuilder.fromXDR(preparedTx.toXDR(), NETWORK_PASSPHRASE);
      txToSign.sign(keeperKey);

      const sendRes = await server.sendTransaction(txToSign);
      if (sendRes.status === "ERROR") {
        throw new Error(`Consensus rejection: ${JSON.stringify(sendRes.errorResult)}`);
      }

      console.log(`⏳ Broadcasted extension. Tx Hash: ${sendRes.hash}`);

      let txStatus = await server.getTransaction(sendRes.hash);
      while (txStatus.status === StellarRpc.Api.GetTransactionStatus.NOT_FOUND) {
        await new Promise((r) => setTimeout(r, 2000));
        txStatus = await server.getTransaction(sendRes.hash);
      }

      if (txStatus.status === StellarRpc.Api.GetTransactionStatus.SUCCESS) {
        console.log(
          `✅ [KEEPER] Footprint TTL extended successfully by +${EXTEND_DELTA_LEDGERS} ledgers!`
        );
      } else {
        throw new Error(`Ledger inclusion failed: ${JSON.stringify(txStatus)}`);
      }
    } catch (sdkErr: any) {
      console.warn(
        `⚠️ [KEEPER] SDK extension fault (${sdkErr?.message || sdkErr}) -> trying stellar contract extend...`
      );
      try {
        extendViaCli(currentSeq);
      } catch (cliErr: any) {
        console.error("❌ [KEEPER] CLI fallback failed:", cliErr?.message || cliErr);
      }
    }
  } else {
    console.log("✨ [KEEPER] All monitored contract entries are within safe operational limits.");
  }
}

async function runLoop() {
  await checkAndExtendTTL();
  setInterval(() => {
    checkAndExtendTTL().catch((err) => {
      console.error("❌ [KEEPER-FAULT]:", err?.message || err);
    });
  }, POLL_INTERVAL_MS);
}

runLoop().catch((err) => {
  console.error("❌ [KEEPER-FATAL]:", err?.message || err);
  process.exit(1);
});
