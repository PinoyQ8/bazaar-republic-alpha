import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = prisma as any;

    // Use raw runCommand aggregate to guarantee BSON-safe reading and bypass P2032 traps
    const rawRes: any = await db.$runCommandRaw({
      aggregate: "EscrowLock",
      pipeline: [
        { $sort: { createdAt: -1, _id: -1 } },
        { $limit: 50 },         {$project: {
            _id: 1,
            escrowId: 1,
            consumerUid: 1,
            providerId: 1,
            amount: 1,
            token: 1,
            status: 1,
            timelockExpiresAt: 1,
            serviceDescription: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ],
      cursor: {}
    }).catch(() => null);

    const rawBatch = rawRes?.cursor?.firstBatch || [];

    const formatted = rawBatch.map((doc: any) => {
      const amountPi = Number(doc.amount || 0);
      const amountMbzr = amountPi * 1000;
      const rawId = doc._id?.$oid || String(doc._id || "");

      return {
        id: rawId,
        escrowId: doc.escrowId || `ESC_${rawId.slice(-6)}`,
        consumerUid: doc.consumerUid || "usr_pioneer",
        providerId: doc.providerId ? String(doc.providerId) : "usr_provider",
        amountPi: amountPi,
        amountMbzr: amountMbzr,
        token: doc.token || "PI",
        status: doc.status || "LOCKED",
        expiresAt: doc.timelockExpiresAt?.$date || doc.timelockExpiresAt || new Date().toISOString(),
        createdAt: doc.createdAt?.$date || doc.createdAt || new Date().toISOString(),
        serviceDescription: doc.serviceDescription || "E-Network Merchant Escrow Lock"
      };
    });

    return NextResponse.json({
      success: true,
      count: formatted.length,
      escrows: formatted
    }, { status: 200 });

  } catch (err: any) {
    console.error("[ESCROW_LIST_CRASH]:", err);
    return NextResponse.json({ success: true, count: 0, escrows: [] }, { status: 200 });
  }
}
