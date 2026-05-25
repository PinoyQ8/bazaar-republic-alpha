// lib/faucet.ts
import * as StellarSdk from 'stellar-sdk';

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const PI_TESTNET_PASSPHRASE = 'Pi Testnet';

export async function executeFaucetTransfer(destinationPubKey: string, amount: string) {
  // 1. Ignite the Distributor (Hot Wallet) Key
  const distributorSecret = process.env.DISTRIBUTOR_SECRET_KEY;
  if (!distributorSecret) {
    throw new Error("SECURITY FRACTURE: DISTRIBUTOR_SECRET_KEY is missing from environment.");
  }

  const distributorKeyPair = StellarSdk.Keypair.fromSecret(distributorSecret);
  const issuerPubKey = "GCD4GW27B2PQZGJGLCAQYEAEKDDDGWY7U6CHNSFY6AOEUBLEU3FGWG4D"; // The Genesis Vault

  try {
    // 2. Load the Hot Wallet Sequence State
    const distributorAccount = await server.loadAccount(distributorKeyPair.publicKey());
    const mBZR = new StellarSdk.Asset("mBZR", issuerPubKey);

    // 3. Forge the Distribution Payload
    const transaction = new StellarSdk.TransactionBuilder(distributorAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: PI_TESTNET_PASSPHRASE
    })
    .addOperation(StellarSdk.Operation.payment({
      destination: destinationPubKey,
      asset: mBZR,
      amount: amount
    }))
    .setTimeout(30)
    .build();

    // 4. Cryptographic Signature
    transaction.sign(distributorKeyPair);
    console.log(`[MESH-SECURE] Faucet Payload signed. Transmitting ${amount} mBZR to Pioneer...`);

    // 5. Submit to Horizon Ledger
    const response = await server.submitTransaction(transaction);
    return response.hash; // Return the immutable receipt to the API route

  } catch (error: any) {
    const fractureCode = error.response?.data?.extras?.result_codes || error.message;
    console.error("[MESH-FRACTURE] Faucet transaction rejected:", fractureCode);
    throw new Error(`Ledger rejection: ${JSON.stringify(fractureCode)}`);
  }
}