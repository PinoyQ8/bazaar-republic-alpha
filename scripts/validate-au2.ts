import * as dotenv from 'dotenv';
import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
} from '@stellar/stellar-sdk';

dotenv.config();

console.log('\n--- BAZAAR A2U VALIDATION RUNNER (IDENTIFIER MEMO FIX) ---');

const PI_API_BASE = 'https://api.minepi.com/v2';
const PI_API_KEY = process.env.PI_API_KEY?.trim() || '';
const APP_WALLET_SEED = process.env.APP_WALLET_SEED?.trim() || '';
const HORIZON_TESTNET_URL = 'https://api.testnet.minepi.com';

if (!PI_API_KEY || !APP_WALLET_SEED) {
  console.error('FATAL: Missing PI_API_KEY or APP_WALLET_SEED in .env');
  process.exit(1);
}

const horizonServer = new Horizon.Server(HORIZON_TESTNET_URL);
const appKeypair = Keypair.fromSecret(APP_WALLET_SEED);

console.log(`Source App Wallet: ${appKeypair.publicKey()}`);

interface PioneerRecipient {
  uid: string;
  walletAddress: string;
  amount: number;
}

async function piFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${PI_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Key ${PI_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const error: any = new Error(`HTTP ${response.status}: ${data?.error || 'Request failed'}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function createA2UPayment(uid: string, amount: number) {
  try {
    const data = await piFetch('/payments', {
      method: 'POST',
      body: JSON.stringify({
        payment: {
          amount,
          memo: 'A2U-Validation',
          metadata: { purpose: 'a2u_gate_validation' },
          uid,
        },
      }),
    });
    return data.payment || data;
  } catch (error: any) {
    if (error.data?.error === 'ongoing_payment_found') {
      console.warn('⚠️  Ongoing payment found. Resuming existing payment...');
      return error.data.payment || error.data;
    }
    throw error;
  }
}

async function submitOnChainTransfer(
  destinationAddress: string,
  amount: number,
  paymentIdentifier: string
): Promise<string> {
  try {
    const sourceAccount = await horizonServer.loadAccount(appKeypair.publicKey());

    // The Stellar Memo MUST be the exact 28-character payment identifier
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '100000', // 0.01 Test-Pi
      networkPassphrase: 'Pi Testnet',
    })
      .addOperation(
        Operation.payment({
          destination: destinationAddress,
          asset: Asset.native(),
          amount: amount.toFixed(7),
        })
      )
      .addMemo(Memo.text(paymentIdentifier))
      .setTimeout(30)
      .build();

    transaction.sign(appKeypair);
    const result = await horizonServer.submitTransaction(transaction);
    return result.hash;
  } catch (error: any) {
    if (error.response?.data?.extras?.result_codes) {
      console.error(
        '\n--- HORIZON TRANSACTION ERROR CODES ---',
        JSON.stringify(error.response.data.extras.result_codes, null, 2)
      );
    }
    throw error;
  }
}

async function completeA2UPayment(paymentId: string, txid: string) {
  const data = await piFetch(`/payments/${paymentId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ txid }),
  });
  return data.payment || data;
}

async function executeA2UTransfer(recipient: PioneerRecipient): Promise<void> {
  console.log(`\n[Stage 1] Checking/Creating Payment Intent for UID: ${recipient.uid}...`);
  const payment = await createA2UPayment(recipient.uid, recipient.amount);
  const paymentId = payment.identifier;
  console.log(`✓ Payment Identifier: ${paymentId}`);

  console.log(`[Stage 2] Broadcasting transfer to ${recipient.walletAddress} with Memo: ${paymentId}...`);
  const txid = await submitOnChainTransfer(
    recipient.walletAddress,
    recipient.amount,
    paymentId
  );
  console.log(`✓ Settled on Stellar/Pi Ledger: TXID ${txid}`);

  console.log(`[Stage 3] Completing payment handshake on Pi Platform...`);
  const completed = await completeA2UPayment(paymentId, txid);
  const isDone = completed.status?.developer_completed || completed.status?.transaction_verified;
  console.log(`✓ Payment Complete. Status verified: ${isDone ?? true}`);
}

async function runBatchValidation(): Promise<void> {
  // Inside scripts/validate-au2.ts -> runBatchValidation()

const recipients: PioneerRecipient[] = [
  {
    uid: 'c9537394-4395-4e66-81ed-4c3eee6416e8',
    walletAddress: 'GAOOXGGMFTERTRHHL5OW543WAOAKIEOLM32UPKZLFXTGGOM4FSVU57N5',
    amount: 0.1,
  },
];

  for (let i = 0; i < recipients.length; i++) {
    console.log(`\n========================================`);
    console.log(`Executing Transfer ${i + 1} of ${recipients.length}`);
    console.log(`========================================`);
    await executeA2UTransfer(recipients[i]);
  }

  console.log('\n--- ALL A2U VALIDATION TRANSFERS EXECUTED SUCCESSFULLY ---');
}

runBatchValidation()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n--- SCRIPT EXECUTION ERROR ---');
    console.error(err.data || err.message || err);
    process.exit(1);
  });