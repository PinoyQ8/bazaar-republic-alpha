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
const server = new Horizon.Server(HORIZON_URL);

// Provide any funded sender seed (e.g. your deployer or faucet account)
const SENDER_SECRET =
  process.env.PI_DEPLOYER_SECRET ||
  process.env.DEPLOYER_SECRET ||
  process.env.PI_SPONSOR_SECRET ||
  ''; // Paste a funded testnet seed starting with S if not in .env

const TARGET_PUB = 'GCN3PWTGHVJ7HRMBD43THOWZ6KVGLUFIVGGYJDQMFSRJK3CTTTZ5PQJR';

async function sendTestPayment() {
  if (!SENDER_SECRET) {
    console.error('❌ Please define a funded testnet secret in .env or SENDER_SECRET.');
    process.exit(1);
  }

  const senderKeypair = Keypair.fromSecret(SENDER_SECRET.trim());
  const senderPub = senderKeypair.publicKey();

  console.log(`Loading sender account ${senderPub}...`);
  const account = await server.loadAccount(senderPub);

  console.log(`Sending 5.0 Pi to neutralized target ${TARGET_PUB}...`);
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

  tx.sign(senderKeypair);
  const res = await server.submitTransaction(tx);
  console.log('✅ Sent 5.0 Pi to target! Tx Hash:', res.hash);
}

sendTestPayment().catch((err: any) => {
  console.error('🚨 Payment failed:', err?.response?.data || err.message);
});