import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import * as SorobanClient from "@stellar/stellar-sdk";
import { submitContractCall } from "../lib/soroban-relayer";

const CONTRACT_ID = process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID || "CAL7VDQBPLM4Z3LDG4TSALUL3DQAWZIJGWOLYQ3JBND3RJTZ7XLKEIUG";
const SAC_TOKEN = process.env.NEXT_PUBLIC_PI_TOKEN_CONTRACT || "CDG6ZM2SHXIHD5HZ2E62B7D76RY5DUHDNQVPSHRVDNN7W4EW47FXLEXQ";
const PI_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://rpc.testnet.minepi.com";
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || "Pi Testnet";

const secret =
  process.env.STELLAR_VAULT_SEED ||
  process.env.STELLAR_DEPLOYER_SECRET ||
  process.env.KEEPER_SIGNER_SECRET ||
  "";

if (!secret || !secret.startsWith("S") || secret.length !== 56) {
  console.error("❌ Invalid or missing secret key. Ensure STELLAR_VAULT_SEED in .env.local starts with 'S' and is 56 characters.");
  process.exit(1);
}

async function runActiveLockQuery() {
  const signer = SorobanClient.Keypair.fromSecret(secret);
  const server = new SorobanClient.rpc.Server(PI_RPC_URL, { allowHttp: false });
  const contract = new SorobanClient.Contract(CONTRACT_ID);

  const activeEscrowId = `ESC_ACT_${Math.floor(1000 + Math.random() * 9000)}`;
  console.log(`🔐 Locking escrow ${activeEscrowId} on Pi Testnet (Protocol 28)...`);
  console.log(`🔑 Signer Address : ${signer.publicKey()}`);
  console.log(`🎯 Target Vault   : ${CONTRACT_ID}`);

  const symbolArg = SorobanClient.nativeToScVal(activeEscrowId, { type: "symbol" });
  const tokenArg = SorobanClient.Address.fromString(SAC_TOKEN).toScVal();
  const consumerArg = SorobanClient.Address.fromString(signer.publicKey()).toScVal();
  const providerArg = SorobanClient.Address.fromString(signer.publicKey()).toScVal();
  const amountArg = SorobanClient.nativeToScVal(10_000_000n, { type: "i128" });
  const durationArg = SorobanClient.nativeToScVal(172800n, { type: "u64" });

  const lockRes = await submitContractCall(
    CONTRACT_ID,
    "lock_funds",
    [symbolArg, tokenArg, consumerArg, providerArg, amountArg, durationArg],
    signer
  );

  if (!lockRes.success) {
    console.error("❌ Lock failed:", lockRes.error);
    return;
  }
  console.log(`✅ Lock confirmed on ledger! Tx Hash: ${lockRes.hash}`);

  // Query and inspect the active on-chain entry
  console.log(`🔍 Querying get_vault(${activeEscrowId}) on Pi Testnet...`);
  const tx = new SorobanClient.TransactionBuilder(
    new SorobanClient.Account(signer.publicKey(), "0"),
    { fee: "100000", networkPassphrase: NETWORK_PASSPHRASE }
  )
    .addOperation(contract.call("get_vault", symbolArg))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanClient.rpc.Api.isSimulationSuccess(sim)) {
    const rawVal = SorobanClient.scValToNative((sim as any).result?.retval);
    console.log("✅ Live On-Chain Escrow Record Retrieved (Active Lock State):");
    console.log(JSON.stringify(rawVal, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2));
  } else {
    console.error("Simulation failed:", sim.error);
  }
}

runActiveLockQuery();
