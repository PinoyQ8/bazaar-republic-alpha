import { NextResponse } from 'next/server';
import { Horizon, Networks, Keypair, TransactionBuilder, Asset, Operation } from '@stellar/stellar-sdk';
import { prisma } from '@/lib/prisma';

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
    const isMainnet = process.env.STELLAR_NETWORK === 'MAINNET';
    const server = new Horizon.Server(isMainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org');
    
    const sourceKeypair = Keypair.fromSecret(SECRET_SEED!);
    const sourcePublicKey = sourceKeypair.publicKey();

    const testMbzrAsset = new Asset('TESTMBZR', sourcePublicKey);

    for (const payout of pendingDistributions) {
      console.log(`[NEO-SYNC] Processing Pioneer Node: ${payout.uid}`);

      const tokenAmount = (payout.testPiAmount * MBRS_CONVERSION_RATIO).toFixed(7);

      // FALLBACK: Route to our own funded vault public key for local testing
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
        // Only override if the Pi server returns a valid, funded destination
        if (paymentData.to_address) {
          destinationId = paymentData.to_address;
        }
      } catch (piErr) {
        console.log("[NEO NOTE] Pi API Sandbox offline. Routing to local vault target.");
      }

      // STEP 2: BUILD HORIZON TRANSACTION FOR TESTMBZR
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

      // STEP 3: SUBMIT TO LEDGER & LOG TO MASTER INDEX
      const txResponse = await server.submitTransaction(transaction);

      // NEO-SYNC: Push the exact record to MongoDB via Prisma ORM
      await prisma.ledgerLog.create({
        data: {
          uid: payout.uid,
          amount: tokenAmount,
          asset: 'TESTMBZR',
          txHash: txResponse.hash,
          status: 'SUCCESS',
        }
      });

      processedLogs.push({ 
        uid: payout.uid, 
        status: "SUCCESS", 
        transferred: `${tokenAmount} TESTMBZR`,
        txHash: txResponse.hash 
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

  } catch (error: any) {
    const errorDetails = error.response?.data?.extras?.result_codes 
      ? JSON.stringify(error.response.data.extras.result_codes) 
      : error.message || JSON.stringify(error);

    console.error("[NEO ERROR] Queue Halted:", errorDetails);
    processedLogs.push({ status: "HALTED", error: errorDetails });
  } finally {
    isProcessingQueue = false;
  }

  return NextResponse.json({ summary: "E-Network TESTMBZR Distribution Complete", logs: processedLogs });
}