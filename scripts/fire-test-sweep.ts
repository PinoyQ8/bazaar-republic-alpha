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
  const candidateSeeds = [
    process.env.STELLAR_DEPLOYER_SECRET,
    process.env.APP_WALLET_SEED,
    process.env.STELLAR_VAULT_SEED,
    process.env.OPERATOR_STELLAR_SECRET,
  ].filter((s): s is string => Boolean(s && s.startsWith('S') && s.length === 56));

  if (candidateSeeds.length === 0) {
    throw new Error('No valid 56-char secret seeds found in environment.');
  }

  let selectedKeypair: Keypair | null = null;
  let selectedBalance = 0;

  for (const seed of candidateSeeds) {
    try {
      const kp = Keypair.fromSecret(seed.trim());
      const acc = await server.loadAccount(kp.publicKey());
      const native = acc.balances.find((b: any) => b.asset_type === 'native');
      const bal = native ? parseFloat(native.balance) : 0;
      console.log(`Checking candidate ${kp.publicKey().slice(0, 8)}... | Balance: ${bal} Pi`);
      if (bal > 2.0) {
        selectedKeypair = kp;
        selectedBalance = bal;
        break;
      }
    } catch {
      // Account not found or error loading, try next
    }
  }

  if (!selectedKeypair) {
    throw new Error('None of the configured seeds have a liquid balance > 2.0 Pi on Testnet.');
  }

  const senderPub = selectedKeypair.publicKey();
  console.log(`🚀 Using sender: ${senderPub} (Balance: ${selectedBalance} Pi)`);
  console.log(`💸 Sending 1.0 Pi to neutralized target ${TARGET_PUB}...`);

  const senderAccount = await server.loadAccount(senderPub);
  const tx = new TransactionBuilder(senderAccount, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: TARGET_PUB,
        asset: Asset.native(),
        amount: '1.000000',
      })
    )
    .setTimeout(TimeoutInfinite)
    .build();

  tx.sign(selectedKeypair);
  const res = await server.submitTransaction(tx);
  console.log('✅ Inbound test payment confirmed! Hash:', res.hash);
}

run().catch((err: any) => {
  console.error('🚨 Transfer failed:', err?.response?.data || err.message);
});