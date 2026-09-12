const StellarSdk = require("@stellar/stellar-sdk");
const fetch = require("node-fetch");

(async () => {
  const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

  // Your Quest Account keypair (Fee Source)
  const questSecret = "SCV3FTVJ43GYTCDV6A6DSP5NS6G6R2NN7ZQX46IOMWTT3NL5F44ZQF5V";
  const questKeypair = StellarSdk.Keypair.fromSecret(questSecret);
  console.log(`Quest Account (Fee Source): ${questKeypair.publicKey()}`);

  // 1. Ensure the Quest Account exists and is funded
  try {
    await fetch(`https://friendbot.stellar.org?addr=${questKeypair.publicKey()}`);
    console.log("Quest Account funded via Friendbot.");
  } catch (e) {
    console.log("Quest Account is already active.");
  }

  // 2. Generate two disposable test accounts (Sender and Destination)
  const senderKeypair = StellarSdk.Keypair.random();
  const destinationKeypair = StellarSdk.Keypair.random();

  await Promise.all([senderKeypair, destinationKeypair].map(async (kp) => {
    const res = await fetch(`https://friendbot.stellar.org?addr=${kp.publicKey()}`);
    if (!res.ok) throw new Error(`Friendbot failed for ${kp.publicKey()}`);
  }));
  console.log("Sender & Destination accounts funded.");

  // 3. Build & sign the inner payment transaction
  const senderAccount = await server.loadAccount(senderKeypair.publicKey());

  const innerTx = new StellarSdk.TransactionBuilder(senderAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationKeypair.publicKey(),
        asset: StellarSdk.Asset.native(),
        amount: "10",
        source: senderKeypair.publicKey(),
      })
    )
    .setTimeout(30)
    .build();

  innerTx.sign(senderKeypair);
  console.log("Inner transaction signed by sender.");

  // 4. Wrap with Fee-Bump using the Quest Account
  const feeBumpTx = StellarSdk.TransactionBuilder.buildFeeBumpTransaction(
    questKeypair,
    StellarSdk.BASE_FEE * 2, // Must be >= inner transaction fee
    innerTx,
    StellarSdk.Networks.TESTNET
  );

  // 5. Sign with the Quest keypair and submit
  feeBumpTx.sign(questKeypair);
  console.log("Fee-bump envelope signed by Quest Account.");

  try {
    const response = await server.submitTransaction(feeBumpTx);
    console.log("\nSubmission successful!");
    console.log(`Fee-Bump Hash: ${response.fee_bump_transaction.hash}`);
    console.log(`Inner Hash:    ${response.inner_transaction.hash}`);
    console.log("\nNow click 'Verify' in Stellar Quest!");
  } catch (err) {
    console.error("Submission failed:", err.response ? err.response.data : err.message);
  }
})();