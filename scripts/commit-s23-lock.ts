import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { Keypair, Contract, TransactionBuilder, nativeToScVal, Address, rpc as StellarRpc } from "@stellar/stellar-sdk";

const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://rpc.testnet.minepi.com";
const PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || "Pi Testnet";
const VAULT_ID = "CBM5SVJHLHNAEUR4GA3IV5KZFPCCMGTZGMAJUNURUQIEFPTKZLKXQ3RY";
const SAC_TOKEN = "CDG6ZM2SHXIHD5HZ2E62B7D76RY5DUHDNQVPSHRVDNN7W4EW47FXLEXQ";
const DEPLOYER_ADDR = "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3";

async function commitLock() {
  const secret = process.env.STELLAR_DEPLOYER_SECRET || process.env.STELLAR_VAULT_SEED;
  if (!secret) throw new Error("Missing secret key in .env.local");

  const signer = Keypair.fromSecret(secret.trim());
  const server = new StellarRpc.Server(RPC_URL, { allowHttp: false });
  const contract = new Contract(VAULT_ID);

  console.log("📡 Fetching account sequence for", signer.publicKey());
  const account = await server.getAccount(signer.publicKey());

  const op = contract.call(
    "lock_funds",
    nativeToScVal("ESC_S23_TEST_LOCK_01", { type: "symbol" }),
    Address.fromString(SAC_TOKEN).toScVal(),
    Address.fromString(DEPLOYER_ADDR).toScVal(),
    Address.fromString(DEPLOYER_ADDR).toScVal(),
    nativeToScVal(10000000, { type: "i128" }),
    nativeToScVal(172800, { type: "u64" })
  );

  console.log("⚡ Simulating transaction on Pi Testnet...");
  let tx = new TransactionBuilder(account, { fee: "10000000", networkPassphrase: PASSPHRASE })
    .addOperation(op)
    .setTimeout(60)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (StellarRpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation Error: ${sim.error}`);
  }

  const assembled = StellarRpc.assembleTransaction(tx, sim).build();
  assembled.sign(signer);

  console.log("🚀 Submitting lock to ledger...");
  const res = await server.sendTransaction(assembled);
  console.log("Submission status:", res.status, "| Tx:", res.hash);

  let txStatus = await server.getTransaction(res.hash);
  let tries = 0;
  while (txStatus.status === "NOT_FOUND" && tries < 20) {
    await new Promise((r) => setTimeout(r, 2000));
    txStatus = await server.getTransaction(res.hash);
    tries++;
  }

  if (txStatus.status === "SUCCESS") {
    console.log("✅ [ON-CHAIN SUCCESS] ESC_S23_TEST_LOCK_01 is locked on-chain!");
  } else {
    console.error("❌ Transaction execution status:", txStatus);
  }
}

commitLock().catch((e) => console.error("❌ Failure:", e.message || e));
