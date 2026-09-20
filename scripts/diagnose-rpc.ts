import { Keypair, Horizon, rpc as StellarRpc } from "@stellar/stellar-sdk";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function diagnose() {
  const secret = process.env.STELLAR_DEPLOYER_SECRET || process.env.STELLAR_VAULT_SEED || "";
  if (!secret) {
    console.error("❌ No secret key found in .env.local");
    return;
  }
  const signer = Keypair.fromSecret(secret.trim());
  const pubKey = signer.publicKey();

  console.log("\n--- 1. Testing Horizon loadAccount (api.testnet.minepi.com) ---");
  try {
    const horizon = new Horizon.Server("https://api.testnet.minepi.com");
    const acc = await horizon.loadAccount(pubKey);
    console.log("✅ Horizon OK! Account sequence:", acc.sequence);
  } catch (err: any) {
    console.error("❌ Horizon Failed:", err.message);
    if (err.cause) console.error("   Cause:", err.cause);
  }

  console.log("\n--- 2. Testing Soroban RPC getHealth (rpc.testnet.minepi.com) ---");
  try {
    const rpcServer = new StellarRpc.Server("https://rpc.testnet.minepi.com", { allowHttp: false });
    const health = await rpcServer.getHealth();
    console.log("✅ Soroban RPC OK! Status:", health.status);
  } catch (err: any) {
    console.error("❌ Soroban RPC Failed:", err.message);
    if (err.cause) console.error("   Cause:", err.cause);
  }
}

diagnose();
