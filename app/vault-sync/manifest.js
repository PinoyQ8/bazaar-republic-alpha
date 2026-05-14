const StellarSdk = require('stellar-sdk');

// Target the Pi Testnet Horizon
const server = new StellarSdk.Server('https://api.testnet.minepi.com');

async function manifestVault() {
  // [ ! ] FOUNDER SECRET: Paste your mobile Testnet 'S...' key here
  const sourceSecret = '[]'; 
  const destinationId = 'GBR4GJHMPJ4ZJQK3MU3KXHXKCDQQ2BL7FCVHKPLYIYFD5MTHN6U7MWHO';

  try {
    console.log("MESH: Connecting to Horizon...");
    const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
    const account = await server.loadAccount(sourceKeypair.publicKey());

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: 'Pi Testnet'
    })
      .addOperation(StellarSdk.Operation.createAccount({
        destination: destinationId,
        startingBalance: '10' 
      }))
      .setTimeout(30)
      .build();

    transaction.sign(sourceKeypair);
    const result = await server.submitTransaction(transaction);
    console.log("------------------------------------------");
    console.log("SUCCESS: VAULT MANIFESTED!");
    console.log("Hash:", result.hash);
    console.log("------------------------------------------");
  } catch (e) {
    console.error("Breach Detected:", e.response ? e.response.data.extras.result_codes : e.message);
  }
}

manifestVault();