import { NextResponse } from "next/server";
import {
  Horizon,
  Networks,
  Keypair,
  TransactionBuilder,
  Asset,
  Operation,
} from "@stellar/stellar-sdk";

const MBRS_CONVERSION_RATIO = 1000;

const pendingDistributions = [
  {
    uid: "pioneer_node_alpha",
    testPiAmount: 0.0015,
    memo: "MESH Uptime Shield Reward",
  },
  {
    uid: "pioneer_node_beta",
    testPiAmount: 0.002,
    memo: "E-Network Grant",
  },
];

interface ProcessedPayoutLog {
  uid: string;
  status: string;
  transferred: string;
  txHash: string;
  elapsedMs: number;
}

let isProcessingQueue = false;

export async function GET(req: Request) {
  void req;

  if (isProcessingQueue) {
    return NextResponse.json(
      { status: "Queue locked. MESH active." },
      { status: 429 }
    );
  }

  isProcessingQueue = true;
  const routeStart = Date.now();
  const processedLogs: ProcessedPayoutLog[] = [];
  const API_KEY = process.env.PI_API_KEY;
  const SECRET_SEED = process.env.STELLAR_VAULT_SEED;

  try {
    if (!SECRET_SEED) {
      throw new Error(
        "STELLAR_VAULT_SEED is missing from environment variables."
      );
    }

    const isMainnet = process.env.STELLAR_NETWORK === "MAINNET";
    const horizonUrl = isMainnet
      ? "https://horizon.stellar.org"
      : "https://horizon-testnet.stellar.org";
    const networkPassphrase = isMainnet ? Networks.PUBLIC : Networks.TESTNET;

    const server = new Horizon.Server(horizonUrl);
    const sourceKeypair = Keypair.fromSecret(SECRET_SEED);
    const sourcePublicKey = sourceKeypair.publicKey();
    const testMbzrAsset = new Asset("TESTMBZR", sourcePublicKey);

    const feeStart = Date.now();
    const baseFee = await server.fetchBaseFee();
    console.log(
      `[NEO-SYNC] Fetched base fee (${baseFee}) in ${Date.now() - feeStart}ms`
    );

    for (const payout of pendingDistributions) {
      const nodeStart = Date.now();
      console.log(`[NEO-SYNC] Processing Pioneer Node: ${payout.uid}`);

      const tokenAmount = (payout.testPiAmount * MBRS_CONVERSION_RATIO).toFixed(
        7
      );
      let destinationId = sourcePublicKey;

      const piStart = Date.now();
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (API_KEY) {
          headers.Authorization = `Key ${API_KEY}`;
        }

        const createRes = await fetch("https://api.minepi.com/v2/payments", {
          method: "POST",
          headers,
          signal: AbortSignal.timeout(5000),
          body: JSON.stringify({
            payment: {
              amount: payout.testPiAmount,
              memo: payout.memo,
              metadata: {
                domain: "Project Bazaar DAO",
                protocol: "MESH-A2U",
                asset: "TESTMBZR",
              },
              uid: payout.uid,
            },
          }),
        });

        if (createRes.ok) {
          const paymentData = await createRes.json();
          if (paymentData?.to_address) {
            destinationId = paymentData.to_address;
          }
        } else {
          console.log(
            `[NEO NOTE] Pi API returned ${createRes.status} in ${Date.now() - piStart}ms. Routing to vault target.`
          );
        }
      } catch {
        console.log(
          `[NEO NOTE] Pi API Sandbox offline or timed out after ${Date.now() - piStart}ms. Routing to local vault target.`
        );
      }

      const txPrepStart = Date.now();
      const sourceAccount = await server.loadAccount(sourcePublicKey);

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: baseFee.toString(),
        networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: destinationId,
            asset: testMbzrAsset,
            amount: tokenAmount,
          })
        )
        .setTimeout(180)
        .build();

      transaction.sign(sourceKeypair);

      console.log(`[NEO-SYNC] Submitting Horizon Tx for ${payout.uid}...`);
      const txResponse = await server.submitTransaction(transaction);
      const nodeElapsedMs = Date.now() - nodeStart;

      console.log(
        `[NEO-SYNC] Completed ${payout.uid} (prep+submit: ${Date.now() - txPrepStart}ms, total: ${nodeElapsedMs}ms, hash: ${txResponse.hash})`
      );

      processedLogs.push({
        uid: payout.uid,
        status: "SUBMITTED",
        transferred: tokenAmount,
        txHash: txResponse.hash,
        elapsedMs: nodeElapsedMs,
      });
    }

    const totalElapsedMs = Date.now() - routeStart;
    console.log(
      `[NEO-SYNC] Batch complete (${processedLogs.length} nodes) in ${totalElapsedMs}ms`
    );

    return NextResponse.json({
      success: true,
      elapsedMs: totalElapsedMs,
      processed: processedLogs,
    });
  } catch (error: any) {
    console.error("[NEO ERROR] Queue Halted during processing loop.");
    console.error(
      `[NEO ERROR] Message: ${error?.message || "Unknown Fracture"}`
    );
    if (error?.stack) {
      console.error(error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        elapsedMs: Date.now() - routeStart,
        message: `QUEUE_HALTED: ${error?.message || "Unknown Fracture"}`,
      },
      { status: 500 }
    );
  } finally {
    isProcessingQueue = false;
  }
}