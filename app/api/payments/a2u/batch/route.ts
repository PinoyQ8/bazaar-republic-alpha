import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMeshHmac } from "@/lib/crypto/hmac";

export const dynamic = "force-dynamic";

export interface A2URecipient {
  uid: string;
  amount: number;
  memo?: string;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const { recipients, signature, batchId } = body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing or empty recipients array" },
        { status: 400 }
      );
    }

    // 1. Require HMAC signature verification when secret is configured
    const hmacSecret = process.env.A2U_HMAC_SECRET || process.env.PI_API_KEY;
    if (hmacSecret) {
      if (!signature || typeof signature !== "string") {
        return NextResponse.json(
          { success: false, error: "Missing cryptographic batch signature" },
          { status: 401 }
        );
      }

      const timestampHeader = req.headers.get("x-mesh-timestamp");
const hmacCheck = (verifyMeshHmac as (...args: any[]) => any)(
  rawBody,
  signature,
  timestampHeader
);

const isValid =
  typeof hmacCheck === "boolean" ? hmacCheck : Boolean(hmacCheck?.isValid);

      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: hmacCheck?.error || "Invalid cryptographic batch signature",
          },
          { status: 401 }
        );
      }
    }

    const resolvedBatchId =
      typeof batchId === "string" && batchId.trim()
        ? batchId.trim()
        : `BATCH_${Date.now()}`;

    // 2. Compute Total Batch Allocation strictly in PI
    const totalAmountPi = recipients.reduce((sum: number, item: A2URecipient) => {
      const amt = Number(item?.amount);
      return Number.isFinite(amt) && amt > 0 ? sum + amt : sum;
    }, 0);

    const db = prisma as any;
    const processedResults: Array<{
      uid: string;
      amount: number;
      asset: "PI";
      status: string;
    }> = [];

    // 3. Process Allocations sequentially
    for (const item of recipients as A2URecipient[]) {
      const uid = typeof item?.uid === "string" ? item.uid.trim() : "";
      const amount = Number(item?.amount);

      if (!uid || !Number.isFinite(amount) || amount <= 0) {
        processedResults.push({
          uid: uid || "UNKNOWN",
          amount: Number.isFinite(amount) ? amount : 0,
          asset: "PI",
          status: "SKIPPED_INVALID",
        });
        continue;
      }

      try {
        if (db?.pioneerNode?.updateMany) {
          await db.pioneerNode.updateMany({
            where: { uid },
            data: {
              lastActivityTimestamp: new Date(),
            },
          });
        }

        if (db?.ledgerLog?.create) {
          await db.ledgerLog.create({
            data: {
              uid,
              amount: String(amount),
              asset: "PI",
              txHash: `${resolvedBatchId}:${uid}`,
              status: "QUEUED_A2U_PI",
            },
          });
        }

        processedResults.push({
          uid,
          amount,
          asset: "PI",
          status: "SUCCESS",
        });
      } catch (err: any) {
        console.error(`[A2U_BATCH_ITEM_ERROR] uid=${uid}:`, err);
        processedResults.push({
          uid,
          amount,
          asset: "PI",
          status: "ERROR_PROCESSING",
        });
      }
    }

    return NextResponse.json({
      success: true,
      batchId: resolvedBatchId,
      asset: "PI",
      totalProcessed: processedResults.filter((r) => r.status === "SUCCESS").length,
      totalAmount: totalAmountPi,
      results: processedResults,
    });
  } catch (error: any) {
    console.error("[A2U_BATCH_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Batch payout processing failed" },
      { status: 500 }
    );
  }
}