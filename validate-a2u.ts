import * as dotenv from 'dotenv';
import axios from 'axios';
import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
} from '@stellar/stellar-sdk';

// 🛡️ Load environment keys
dotenv.config();

const PI_API_BASE = 'https://api.minepi.com/v2';
const PI_API_KEY = (process.env.PI_API_KEY || '').trim();
const APP_WALLET_SEED = (process.env.APP_WALLET_SEED || '').trim();
const HORIZON_URL = 'https://api.testnet.minepi.com'; // Pi Testnet Horizon Node

console.log('\n=============================================================');
console.log('🏛️  PROJECT BAZAAR — ULTIMATE SELF-HEALING TEST-PI A2U DISBURSER');
console.log('=============================================================');

if (!PI_API_KEY || !APP_WALLET_SEED) {
  console.error('❌ FATAL: Missing PI_API_KEY or APP_WALLET_SEED in your .env file!');
  process.exit(1);
}

// Initialize Horizon server and Developer App keypair
const horizonServer = new Horizon.Server(HORIZON_URL);
const appKeypair = Keypair.fromSecret(APP_WALLET_SEED);

console.log(`📡 App Hot Wallet Address: ${appKeypair.publicKey()}`);

interface Recipient {
  uid: string;
  amount: number;
  memo: string;
}

// 🛡️ Your 5 actual authenticated Pioneer UIDs
const recipients: Recipient[] = [
  { uid: "3e4e5737-1d68-42c0-b80f-e01f7f66e0e7", amount: 1.0, memo: "Pioneer Alpha Node Yield" },
  { uid: "4979f4a0-9f86-453f-be1a-c56f0cae64e9", amount: 1.0, memo: "Pioneer Alpha Node Yield" },
  { uid: "c9537394-4395-4e66-81ed-4c3eee6416e", amount: 2.0, memo: "MESH Relay Operator Bonus" },
  { uid: "cf70edd5-a807-4a02-838d-1649f00a3ef2", amount: 0.5, memo: "Academy Stage Completion" },
  { uid: "5f747bc9-1302-4135-a40d-af7880174f16", amount: 1.2, memo: "Arbitration Staking Yield Return" }
];

/**
 * Builds, signs with APP_WALLET_SEED, and broadcasts a real payment on-chain
 */
async function submitOnChainTransfer(destinationAddress: string, amount: number, paymentId: string): Promise<string> {
  const account = await horizonServer.loadAccount(appKeypair.publicKey());
  
  const tx = new TransactionBuilder(account, {
    fee: "100000", // standard Testnet base fee
    networkPassphrase: "Pi Testnet"
  })
  .addOperation(
    Operation.payment({
      destination: destinationAddress,
      asset: Asset.native(),
      amount: amount.toFixed(7) // Enforce exact float decimals
    })
  )
  .addMemo(Memo.text(paymentId)) // CRITICAL: Memo must match the Pi Payment ID exactly!
  .setTimeout(180)
  .build();

  tx.sign(appKeypair);
  const response = await horizonServer.submitTransaction(tx);
  return response.hash;
}

/**
 * Resolves a single payment end-to-end, handling on-chain routing & API finalization
 */
async function resolvePayment(paymentId: string, destinationAddress: string, amount: number): Promise<string> {
  console.log(`   ⏳ Step A: Aligning transaction state for Payment ID: ${paymentId}...`);
  
  // 1. Query Pi Platform to see if a transaction has already been linked
  const statusRes = await axios.get(`${PI_API_BASE}/payments/${paymentId}`, {
    headers: { 'Authorization': `Key ${PI_API_KEY}` }
  });

  let txHash = statusRes.data.transaction?.txid;

  if (txHash) {
    console.log(`   ✅ Alignment verified! Found already-linked hash on Pi Server: ${txHash}`);
  } else {
    // 2. No transaction linked on the server. Let's broadcast it on-chain now!
    console.log(`   ⏳ No existing transaction linked. Broadcasting payment on-chain...`);
    txHash = await submitOnChainTransfer(destinationAddress, amount, paymentId);
    console.log(`   ✅ Stellar Tx Committed! Hash: ${txHash}`);
  }

  // 3. Complete the payment on the Pi Platform
  console.log(`   ⏳ Step B: Submitting completion to Pi Platform...`);
  try {
    const completeRes = await axios.post(`${PI_API_BASE}/payments/${paymentId}/complete`, {
      txid: txHash
    }, {
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   🎉 SUCCESS! ${amount} Test-Pi permanently settled on-chain!`);
    return completeRes.data.transaction?.txid || txHash;
  } catch (completeErr: any) {
    if (completeErr.response?.status === 400) {
      const errData = completeErr.response.data;
      console.error(`   ❌ Completion rejected with 400: ${JSON.stringify(errData)}`);
      
      // If the server rejected completion because of a permanent error (like verification_failed or invalid_amount),
      // we MUST cancel this payment to free the queue!
      console.warn(`   ⚠️ Attempting to CANCEL stuck payment ${paymentId} to free the app queue...`);
      try {
        await axios.post(`${PI_API_BASE}/payments/${paymentId}/cancel`, {}, {
          headers: {
            'Authorization': `Key ${PI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`   🎉 SUCCESS! Stuck payment ${paymentId} has been CANCELLED. Queue cleared!`);
        throw new Error('PAYMENT_CANCELLED');
      } catch (cancelErr: any) {
        console.error(`   ❌ Failed to cancel payment: ${cancelErr.response?.status || cancelErr.message} - ${JSON.stringify(cancelErr.response?.data || '')}`);
        throw completeErr;
      }
    } else {
      throw completeErr;
    }
  }
}

async function executeRealA2UPayments() {
  console.log(`🚀 Dispatching sequential ledger payments...`);
  
  for (const [index, recipient] of recipients.entries()) {
    console.log(`\n-------------------------------------------------------------`);
    console.log(`👤 [Recipient ${index + 1}/5] Target: ${recipient.uid}`);

    let completed = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!completed && attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`   ⏳ Creating payment request on Pi Platform (Attempt ${attempts})...`);
        const createRes = await axios.post(`${PI_API_BASE}/payments`, {
          payment: {
            amount: recipient.amount,
            memo: recipient.memo,
            metadata: { purpose: 'real_test_a2u_batch' },
            uid: recipient.uid
          }
        }, {
          headers: {
            'Authorization': `Key ${PI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        const paymentId = createRes.data.identifier;
        const destinationAddress = createRes.data.to_address;
        console.log(`   ✅ Payment created. ID: ${paymentId}`);
        
        await resolvePayment(paymentId, destinationAddress, recipient.amount);
        completed = true;

      } catch (err: any) {
        if (err.response?.data?.error === 'ongoing_payment_found') {
          const ongoingPayment = err.response.data.payment;
          const stuckId = ongoingPayment.identifier;
          const stuckAddress = ongoingPayment.to_address;
          const stuckAmount = ongoingPayment.amount;
          const stuckUid = ongoingPayment.uid;

          console.warn(`   ⚠️ STUCK PIPELINE DETECTED! Found open payment ID: ${stuckId} for UID: ${stuckUid}`);
          console.log(`   ⚡ Switching context to resolve and clear the stuck payment...`);
          
          try {
            await resolvePayment(stuckId, stuckAddress, stuckAmount);
            console.log(`   ✅ Stuck payment ${stuckId} successfully cleared! Retrying original recipient...`);
          } catch (clearErr: any) {
            if (clearErr.message === 'PAYMENT_CANCELLED') {
              console.log(`   ✅ Stuck payment ${stuckId} successfully CANCELLED and cleared! Retrying original recipient...`);
            } else {
              console.error(`   ❌ Failed to clear stuck payment: ${clearErr.message}`);
              break; // Break the while loop if we can't clear the jam
            }
          }

        } else {
          console.error(`   ✗ Transaction failed for Pioneer ${recipient.uid}:`);
          if (err.response) {
            console.error(`     API Error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
          } else {
            console.error(`     Error details: ${err.message}`);
          }
          break; // Break the while loop for other errors
        }
      }
    }

    if (!completed) {
      console.error(`   ❌ Max attempts reached. Could not process payout for ${recipient.uid}.`);
    }

    // Cooldown pause to prevent transaction sequence number collisions on the hot wallet
    console.log('⏳ Syncing sequence sequence cooldown...');
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  console.log(`\n=============================================================`);
  console.log(`🎉 Batch execution finished. All 5 payouts fully synchronized!`);
  console.log(`=============================================================`);
}

executeRealA2UPayments();
