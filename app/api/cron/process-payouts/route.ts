import { NextResponse } from "next/server";
import {
  Horizon,
  Networks,
  Keypair,
  TransactionBuilder,
  Asset,
  Operation,
} from "@stellar/stellar-sdk";

export const dynamic = "force-dynamic";

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

async function resolveDestinationAddress(
  payout: { uid: string; testPiAmount: number; memo: string },
  fallbackAddress: string,
  apiKey?: string
): Promise<string> {
  if (!apiKey || process.env.DISABLE_PI_A2U_LOOKUP === "true") {
    return fallbackAddress;
  }

  const piStart = Date.now();
  try {
    const res = await fetch("https://api.minepi.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(2500),
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

    if (!res.ok) {
      console.log(
        `[NEO NOTE] Pi API returned ${res.status} in ${Date.now() - piStart}ms. Routing to vault target.`
      );
      return fallbackAddress;
    }

    const data = await res.json().catch(() => null);
    return typeof data?.to_address === "string" && data.to_address.trim()
      ? data.to_address.trim()
      : fallbackAddress;
  } catch {
    console.log(
      `[NEO NOTE] Pi API skipped/timed out after ${Date.now() - piStart}ms. Routing to vault target.`
    );
    return fallbackAddress;
  }
}

export async function GET() {
  if (isProcessingQueue) {
    return NextResponse.json(
      { status: "Queue locked. MESH active." },
      { status: 429 }
    );
  }

  isProcessingQueue = true;
  const routeStart = Date.now();
  const processedLogs: ProcessedPayoutLog[] = [];
  const apiKey = process.env.PI_API_KEY;
  const secretSeed = process.env.STELLAR_VAULT_SEED;

  try {
    if (!secretSeed) {
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
    const sourceKeypair = Keypair.fromSecret(secretSeed);
    const sourcePublicKey = sourceKeypair.publicKey();
    const testMbzrAsset = new Asset("TESTMBZR", sourcePublicKey);

    const prepStart = Date.now();
    const [baseFee, sourceAccount] = await Promise.all([
      server.fetchBaseFee(),
      server.loadAccount(sourcePublicKey),
    ]);
    console.log(
      `[NEO-SYNC] Loaded account & base fee (${baseFee}) in ${Date.now() - prepStart}ms`
    );

    for (const payout of pendingDistributions) {
      const nodeStart = Date.now();
      console.log(`[NEO-SYNC] Processing Pioneer Node: ${payout.uid}`);

      const tokenAmount = (payout.testPiAmount * MBRS_CONVERSION_RATIO).toFixed(
        7
      );
      const destinationId = await resolveDestinationAddress(
        payout,
        sourcePublicKey,
        apiKey
      );

      const txSubmitStart = Date.now();
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
        `[NEO-SYNC] Completed ${payout.uid} (submit: ${Date.now() - txSubmitStart}ms, total: ${nodeElapsedMs}ms, hash: ${txResponse.hash})`
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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown Fracture";
    console.error("[NEO ERROR] Queue Halted during processing loop.");
    console.error(`[NEO ERROR] Message: ${message}`);

    return NextResponse.json(
      {
        success: false,
        elapsedMs: Date.now() - routeStart,
        message: `QUEUE_HALTED: ${message}`,
      },
      { status: 500 }
    );
  } finally {
    isProcessingQueue = false;
  }
}
