// Location: app/api/cron/process-payouts/route.ts
import { NextResponse } from 'next/server';
import { Horizon, Networks, Keypair, TransactionBuilder, Asset, Operation } from '@stellar/stellar-sdk';
// import { prisma } from '@/lib/prisma'; // 🛡️ ADJUDICATOR HALT: Disabled to prevent Mongoose conflict

const MBRS_CONVERSION_RATIO = 1000;

const pendingDistributions = [
  { uid: "pioneer_node_alpha", testPiAmount: 0.0015, memo: "MESH Uptime Shield Reward" },
  { uid: "pioneer_node_beta", testPiAmount: 0.0020, memo: "E-Network Grant" }
];

let isProcessingQueue = false; 

export async function GET(req: Request) { 
  if (isProcessingQueue) {
    return NextResponse.json({ status: "Queue locked. MESH active." });
  }

  isProcessingQueue = true;
  const processedLogs = [];
  const API_KEY = process.env.PI_API_KEY;
  const SECRET_SEED = process.env.STELLAR_VAULT_SEED;

  try {
    if (!SECRET_SEED) {
      throw new Error("STELLAR_VAULT_SEED is missing from environment variables.");
    }

    const isMainnet = process.env.STELLAR_NETWORK === 'MAINNET';
    const server = new Horizon.Server(isMainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org');
    
    const sourceKeypair = Keypair.fromSecret(SECRET_SEED);
    const sourcePublicKey = sourceKeypair.publicKey();
    const testMbzrAsset = new Asset('TESTMBZR', sourcePublicKey);

    for (const payout of pendingDistributions) {
      console.log(`[NEO-SYNC] Processing Pioneer Node: ${payout.uid}`);
      const tokenAmount = (payout.testPiAmount * MBRS_CONVERSION_RATIO).toFixed(7);
      
      let destinationId = sourcePublicKey; 
      
      try {
        const createRes = await fetch('https://api.minepi.com/v2/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment: {
              amount: payout.testPiAmount,
              memo: payout.memo,
              metadata: { domain: "Project Bazaar DAO", protocol: "MESH-A2U", asset: "TESTMBZR" },
              uid: payout.uid
            }
          })
        });
        const paymentData = await createRes.json();
        if (paymentData.to_address) {
          destinationId = paymentData.to_address;
        }
      } catch (piErr) {
        console.log("[NEO NOTE] Pi API Sandbox offline. Routing to local vault target.");
      }

      const sourceAccount = await server.loadAccount(sourcePublicKey);
      const fee = await server.fetchBaseFee();

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: fee.toString(),
        networkPassphrase: isMainnet ? Networks.PUBLIC : Networks.TESTNET
      })
      .addOperation(Operation.payment({
        destination: destinationId,
        asset: testMbzrAsset,
        amount: tokenAmount
      }))
      .setTimeout(180)
      .build();

      transaction.sign(sourceKeypair);
      
      console.log(`[NEO-SYNC] Submitting Horizon Tx for ${payout.uid}...`);
      const txResponse = await server.submitTransaction(transaction);

     const processedLogs: Array<{
  uid: string;
  status: string;
  transferred: string;
  txHash: string;
}> = [];
      
      // 🛡️ ADJUDICATOR FIX: Removed artificial 3000ms delay to unblock the queue.
    }

    isProcessingQueue = false;
    return NextResponse.json({ success: true, processed: processedLogs });

  } catch (error: any) {
    isProcessingQueue = false;
    console.error(`[NEO ERROR] Queue Halted during processing loop.`);
    console.error(`[NEO ERROR] Message: ${error.message || 'Unknown Fracture'}`);
    console.error(error.stack); 
    
    return NextResponse.json(
      { success: false, message: `QUEUE_HALTED: ${error.message}` }, 
      { status: 500 }
    );
  }
}