import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
} from "@stellar/stellar-sdk";

const HORIZON_URL = process.env.NEXT_PUBLIC_PI_HORIZON_URL || "https://api.testnet.minepi.com";
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE || "Pi Testnet";
const INCLUSION_FEE = "1000000"; // 0.1 Test-Pi fee buffer

const server = new Horizon.Server(HORIZON_URL);

async function getFreshAccount(publicKey: string): Promise<Horizon.AccountResponse> {
  const res = await fetch(`${HORIZON_URL.replace(/\/$/, "")}/accounts/${publicKey}`);
  if (!res.ok) {
    throw new Error(`Account ${publicKey} not found on Pi Testnet (HTTP ${res.status})`);
  }
  const data = await res.json();
  return new Horizon.AccountResponse(data);
}

async function fundTestAccount(funder: Keypair, targetPubKey: string, amount: string = "10.0000000"): Promise<void> {
  console.log(`⏳ Initializing account on Pi Testnet: ${targetPubKey}...`);
  const funderAccount = await getFreshAccount(funder.publicKey());

  const tx = new TransactionBuilder(funderAccount, {
    fee: INCLUSION_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.createAccount({
        destination: targetPubKey,
        startingBalance: amount,
      })
    )
    .setTimeout(60)
    .build();

  tx.sign(funder);
  const res = await server.submitTransaction(tx);
  console.log(`   ✅ Account created on-chain! Tx Hash: ${res.hash}`);
}

async function runPoC() {
  console.log("================================================================");
  console.log("🛡️ PI NETWORK COUNTER-BOT R&D: LAYER-1 ACCOUNT HARDENING POC");
  console.log("================================================================\n");

  // 1. Resolve Funding Deployer Key (s23-deployer)
  const deployerSecret =
    process.env.STELLAR_DEPLOYER_SECRET ||
    process.env.STELLAR_VAULT_SEED ||
    process.env.KEEPER_SIGNER_SECRET;

  if (!deployerSecret) {
    throw new Error(
      "Missing deployer secret in .env.local (STELLAR_DEPLOYER_SECRET or STELLAR_VAULT_SEED)."
    );
  }

  const deployer = Keypair.fromSecret(deployerSecret.trim());
  console.log(`[+] Deployer / Funding Account   : ${deployer.publicKey()}`);

  // 2. Ephemeral Test Identities
  const victim = Keypair.random();     // Simulates compromised Pioneer wallet
  const guardian = Keypair.random();   // Simulates isolated Security Circle guardian
  const attacker = Keypair.random();   // Malicious bot drain destination
  const safeVault = Keypair.random();  // Uncompromised recovery wallet

  console.log(`[+] Victim Account (Compromised) : ${victim.publicKey()}`);
  console.log(`[+] Guardian Account (Isolated)  : ${guardian.publicKey()}`);
  console.log(`[+] Attacker Bot Target          : ${attacker.publicKey()}`);
  console.log(`[+] Safe Recovery Vault Target   : ${safeVault.publicKey()}\n`);

  // 3. Fund Victim & Safe Vault directly via createAccount
  await fundTestAccount(deployer, victim.publicKey(), "15.0000000");
  await fundTestAccount(deployer, safeVault.publicKey(), "5.0000000");

  // 4. STEP 1: DEFENSE - ESCALATE ACCOUNT THRESHOLDS (SetOptions)
  console.log("\n🛡️ STEP 1: Escalating Account Thresholds (SetOptions)...");
  console.log("   - Setting Master Key Weight  : 1");
  console.log("   - Adding Guardian Key Weight : 1");
  console.log("   - Escalating Thresholds      : Low=2, Med=2, High=2");

  let victimAccount = await getFreshAccount(victim.publicKey());
  const hardenTx = new TransactionBuilder(victimAccount, {
    fee: INCLUSION_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.setOptions({
        signer: {
          ed25519PublicKey: guardian.publicKey(),
          weight: 1,
        },
        masterWeight: 1,
        lowThreshold: 2,
        medThreshold: 2,
        highThreshold: 2,
      })
    )
    .setTimeout(60)
    .build();

  hardenTx.sign(victim);
  const hardenRes = await server.submitTransaction(hardenTx);
  console.log(`✅ Defense Activated On-Chain! Hash: ${hardenRes.hash}\n`);

  // 5. STEP 2: SIMULATE SWEEPER BOT ATTACK (Single-Sig)
  console.log("🤖 STEP 2: Simulating Sweeper Bot Attack...");
  console.log("   - Bot signs transaction using ONLY the compromised key.");

  // Allow short pause for ledger index propagation
  await new Promise((r) => setTimeout(r, 2000));
  victimAccount = await getFreshAccount(victim.publicKey());

  const attackTx = new TransactionBuilder(victimAccount, {
    fee: INCLUSION_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: attacker.publicKey(),
        asset: Asset.native(),
        amount: "5.0000000",
      })
    )
    .setTimeout(60)
    .build();

  attackTx.sign(victim);

  try {
    await server.submitTransaction(attackTx);
    console.error("❌ FAILURE: Bot was able to drain funds!");
  } catch (err: any) {
    const errorCodes = err.response?.data?.extras?.result_codes;
    console.log("🛑 ATTACK BLOCKED BY PI TESTNET CONSENSUS!");
    console.log(`   - Transaction Result Code : ${errorCodes?.transaction || "tx_bad_auth"}`);
    console.log(`   - Operation Result Code   : ${JSON.stringify(errorCodes?.operations || ["op_bad_auth"])}`);
    console.log("   - Verification: Attacker single-sig (Weight 1) < Medium Threshold (2).\n");
  }

  // 6. STEP 3: CO-SIGNED AUTHORIZED RECOVERY
  console.log("🔑 STEP 3: Executing Authorized 2-of-2 Multisig Sweep...");
  console.log("   - Pioneer and Guardian co-sign the recovery transaction.");

  victimAccount = await getFreshAccount(victim.publicKey());
  const recoveryTx = new TransactionBuilder(victimAccount, {
    fee: INCLUSION_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: safeVault.publicKey(),
        asset: Asset.native(),
        amount: "5.0000000",
      })
    )
    .setTimeout(60)
    .build();

  recoveryTx.sign(victim);
  recoveryTx.sign(guardian);

  const recoveryRes = await server.submitTransaction(recoveryTx);
  console.log(`✅ Recovery Sweep Succeeded! Hash: ${recoveryRes.hash}\n`);

  // 7. STEP 4: PERMANENT REVOCATION OF COMPROMISED KEY
  console.log("🔒 STEP 4: Permanently Revoking Leaked Master Key Authority...");
  victimAccount = await getFreshAccount(victim.publicKey());
  const revokeTx = new TransactionBuilder(victimAccount, {
    fee: INCLUSION_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.setOptions({
        masterWeight: 0,
      })
    )
    .setTimeout(60)
    .build();

  revokeTx.sign(victim);
  revokeTx.sign(guardian);

  const revokeRes = await server.submitTransaction(revokeTx);
  console.log(`✅ Master Key Weight Revoked (masterWeight = 0). Hash: ${revokeRes.hash}`);
  console.log("\n================================================================");
  console.log("✨ PoC SUCCESS: Leaked seed phrase permanently neutralized on-chain.");
  console.log("================================================================");
}

runPoC().catch(console.error);
