import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  TimeoutInfinite,
} from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const HORIZON_URL = process.env.PI_HORIZON_URL || 'https://api.testnet.minepi.com';
const NETWORK_PASSPHRASE = process.env.PI_NETWORK_PASSPHRASE || 'Pi Testnet';
const TARGET_PUB = 'GCN3PWTGHVJ7HRMBD43THOWZ6KVGLUFIVGGYJDQMFSRJK3CTTTZ5PQJR';

const server = new Horizon.Server(HORIZON_URL);

async function run() {
  console.log('⚡ Generating disposable sender keypair...');
  const disposable = Keypair.random();
  const disposablePub = disposable.publicKey();
  console.log(`🔑 Ephemeral Sender: ${disposablePub}`);

  console.log('💧 Requesting 20 Test Pi from Friendbot faucet...');
  const faucetRes = await fetch(`https://api.testnet.minepi.com/friendbot?addr=${disposablePub}`);
  if (!faucetRes.ok) {
    throw new Error(`Friendbot failed: ${await faucetRes.text()}`);
  }
  console.log('✅ Ephemeral sender funded!');

  // Wait 1.5 seconds for ledger state propagation
  await new Promise((r) => setTimeout(r, 1500));

  const account = await server.loadAccount(disposablePub);
  console.log(`📤 Sending 5.0 Pi to neutralized target ${TARGET_PUB}...`);

  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: TARGET_PUB,
        asset: Asset.native(),
        amount: '5.000000',
      })
    )
    .setTimeout(TimeoutInfinite)
    .build();

  tx.sign(disposable);
  const txRes = await server.submitTransaction(tx);
  console.log('✅ Inbound payment confirmed on L1! Hash:', txRes.hash);
}

run().catch((err: any) => {
  console.error('🚨 Transfer failed:', err?.response?.data || err.message);
});