const StellarSdk = require('stellar-sdk');

// NEO-SYNC: Using the modern Horizon namespace for Protocol 23
const server = new StellarSdk.Horizon.Server('https://api.testnet.minepi.com');

async function manifestVault() {
  // [ ! ] PASTE THE FULL 'SDW...' KEY BELOW
  const rawSecret = '[ ]'; 
  
  const sourceSecret = rawSecret.trim();
  const destinationId = 'GBR4GJHMPJ4ZJQK3MU3KXHXKCDQQ2BL7FCVHKPLYIYFD5MTHN6U7MWHO';

  try {
    console.log('MESH: Initializing Handshake with Pi Testnet...');
    const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
    const account = await server.loadAccount(sourceKeypair.publicKey());

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: 'Pi Testnet'
    })
      .addOperation(StellarSdk.Operation.createAccount({
        destination: destinationId,
        startingBalance: '50' // Manifesting with 50 Test-Pi
      }))
      .setTimeout(60)
      .build();

    transaction.sign(sourceKeypair);
    const result = await server.submitTransaction(transaction);
    
    console.log('------------------------------------------');
    console.log('SUCCESS: VAULT MANIFESTED!');
    console.log('Hash:', result.hash);
    console.log('------------------------------------------');
  } catch (e) {
    console.error('NEO-SYNC BREACH:', e.message);
  }
}

manifestVault();