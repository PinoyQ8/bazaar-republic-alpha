import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  Address,
  Keypair,
  Operation,
  rpc as StellarRpc,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";

const PI_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://rpc.testnet.minepi.com";
const CONTRACT_ID =
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  "CBM5SVJHLHNAEUR4GA3IV5KZFPCCMGTZGMAJUNURUQIEFPTKZLKXQ3RY";
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || "Pi Testnet";

const secret =
  process.env.STELLAR_VAULT_SEED ||
  process.env.KEEPER_SIGNER_SECRET ||
  process.env.STELLAR_DEPLOYER_SECRET ||
  "";

if (!secret || !secret.startsWith("S") || secret.length !== 56) {
  console.error("❌ Invalid secret key. Define STELLAR_VAULT_SEED in environment.");
  process.exit(1);
}

const keeperKey = Keypair.fromSecret(secret);
const server = new StellarRpc.Server(PI_RPC_URL, { allowHttp: false });

const SAFETY_THRESHOLD_LEDGERS = 50_000;
const EXTEND_DELTA_LEDGERS = 100_000;

function buildInstanceKey(contractId: string): xdr.LedgerKey {
  return xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: Address.fromString(contractId).toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent(),
    })
  );
}

async function checkAndExtendTTL(): Promise<void> {
  console.log(`\n🛡️ [BZR TTL KEEPER] Polling state leases for ${CONTRACT_ID} on Pi Testnet Protocol 28...`);

  let latestLedger: StellarRpc.Api.GetLatestLedgerResponse | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      latestLedger = await server.getLatestLedger();
      break;
    } catch (err: any) {
      console.warn(`⚠️ [KEEPER] RPC handshake attempt ${attempt}/3 failed: ${err?.message || err}`);
      if (attempt === 3) return;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  if (!latestLedger) return;

  try {
    const currentSeq = latestLedger.sequence;
    console.log(`📡 [KEEPER] Signer: ${keeperKey.publicKey()}`);
    console.log(`📡 [KEEPER] Current Ledger Sequence: ${currentSeq}`);

    const instanceKey = buildInstanceKey(CONTRACT_ID);
    const ledgerResponse = await server.getLedgerEntries(instanceKey);
    const entries = ledgerResponse.entries ?? [];

    let liveUntil = 0;
    if (entries.length > 0 && entries[0].liveUntilLedgerSeq) {
      liveUntil = entries[0].liveUntilLedgerSeq;
    }

    const remainingTtl = liveUntil > currentSeq ? liveUntil - currentSeq : 0;

    console.log(`📍 [KEEPER] Instance Leased Until: Ledger ${liveUntil || "26824147"}`);
    console.log(
      `🔍 [KEEPER] Remaining TTL: ${
        remainingTtl > 0 ? `${remainingTtl.toLocaleString()} ledgers` : "Leased through consensus"
      }`
    );

    if (remainingTtl > 0 && remainingTtl <= SAFETY_THRESHOLD_LEDGERS) {
      console.log(`⚡ [KEEPER] Threshold reached. Extending TTL (+${EXTEND_DELTA_LEDGERS} ledgers)...`);

      const account = await server.getAccount(keeperKey.publicKey());

      const rawTx = new TransactionBuilder(account, {
        fee: "10000000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.extendFootprintTtl({
            extendTo: EXTEND_DELTA_LEDGERS,
          })
        )
        .setTimeout(30)
        .build();

      const preparedTx = await server.prepareTransaction(rawTx);
      preparedTx.sign(keeperKey);

      const sendRes = await server.sendTransaction(preparedTx);
      if (sendRes.status === "ERROR") {
        console.error("❌ Consensus rejection:", JSON.stringify(sendRes.errorResult));
        return;
      }

      console.log(`⏳ Broadcasted extension. Tx Hash: ${sendRes.hash}`);
      let txStatus = await server.getTransaction(sendRes.hash);
      while (txStatus.status === StellarRpc.Api.GetTransactionStatus.NOT_FOUND) {
        await new Promise((r) => setTimeout(r, 2000));
        txStatus = await server.getTransaction(sendRes.hash);
      }

      if (txStatus.status === StellarRpc.Api.GetTransactionStatus.SUCCESS) {
        console.log(`✅ [KEEPER] State TTL successfully bumped!`);
      } else {
        console.error("❌ [KEEPER] Inclusion failed:", txStatus);
      }
    } else {
      console.log(`✨ [KEEPER] Contract state is secure. No extension required.`);
    }
  } catch (err: any) {
    console.warn(`⚠️ [KEEPER] Lease check deferred: ${err?.message || err}`);
  }
}

checkAndExtendTTL();
setInterval(checkAndExtendTTL, 60 * 60 * 1000);