// lib/tranche-load.ts
import * as StellarSdk from 'stellar-sdk'; 

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const PI_TESTNET_PASSPHRASE = 'Pi Testnet'; // 🛡️ MESH-LOCK: Network explicitly defined

export async function loadDistributorTranche(amount: string) {
  const secretKey = process.env.ISSUER_SECRET_KEY;
  if (!secretKey) throw new Error("SECURITY FRACTURE: ISSUER_SECRET_KEY is missing.");

  const issuerKeyPair = StellarSdk.Keypair.fromSecret(secretKey);
  const issuerPubKey = issuerKeyPair.publicKey();
  const distributorPubKey = "GAI5DGRUHXCMLDTHMVCZBHGTQXTP2SOS3CMX3KWGAF7XGXTNN5TLMTTA"; 

  console.log(`[MESH-SECURE] Initiating ${amount} mBZR transfer to Hot Wallet...`);

  try {
    // 1. Synchronize Sequence Number
    const issuerAccount = await server.loadAccount(issuerPubKey);

    // 2. Define the Custom Genesis Asset
    const mBZR = new StellarSdk.Asset("mBZR", issuerPubKey);

    // 3. Forge the Transaction Payload
    const transaction = new StellarSdk.TransactionBuilder(issuerAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: PI_TESTNET_PASSPHRASE
    })
    .addOperation(StellarSdk.Operation.payment({
      destination: distributorPubKey,
      asset: mBZR,
      amount: amount
    }))
    .setTimeout(30)
    .build();

    // 4. Cryptographic Signature & Transmission
    transaction.sign(issuerKeyPair);
    console.log("[MESH-SECURE] Payload signed. Transmitting to Horizon ledger...");

    const response = await server.submitTransaction(transaction);
    console.log(`[MESH-SECURE] Tranche successfully loaded. Hash: ${response.hash}`);
    
    return { status: "SECURE", hash: response.hash };

  } catch (error: any) {
    const fractureCode = error.response?.data?.extras?.result_codes || error.message;
    console.error("[MESH-FRACTURE] Ledger rejected the payload:", fractureCode);
    return { status: "FRACTURE", error: fractureCode };
  }
}