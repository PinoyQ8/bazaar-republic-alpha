
const StellarSdk = require('stellar-sdk');

const server = new StellarSdk.Horizon.Server('https://api.testnet.minepi.com');

async function manifestVault() {

  const secret = '[PASSWORD]'.trim();

  const vault = 'GBR4GJHMPJ4ZJQK3MU3KXHXKCDQQ2BL7FCVHKPLYIYFD5MTHN6U7MWHO';

  try {

    console.log('MESH: Signature detected. Manifesting Vault...');

    const sourceKeypair = StellarSdk.Keypair.fromSecret(secret);

    const account = await server.loadAccount(sourceKeypair.publicKey());

    const tx = new StellarSdk.TransactionBuilder(account, { fee: StellarSdk.BASE_FEE, networkPassphrase: 'Pi Testnet' })

      .addOperation(StellarSdk.Operation.createAccount({ destination: vault, startingBalance: '50' }))

      .setTimeout(30).build();

    tx.sign(sourceKeypair);

    const result = await server.submitTransaction(tx);

    console.log('------------------------------------------');

    console.log('SUCCESS: VAULT MANIFESTED!');

    console.log('Hash:', result.hash);

    console.log('------------------------------------------');

  } catch (e) { console.error('NEO-SYNC BREACH:', e.message); }

}

manifestVault();

