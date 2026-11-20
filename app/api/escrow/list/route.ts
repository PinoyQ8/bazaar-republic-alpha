// Location: app/api/escrow/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function extractBsonString(val: any, fallback: string): string {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    if (typeof val.$oid === "string") return val.$oid;
    if (typeof val.id === "string") return val.id;
    if (typeof val._id === "string") return val._id;
    if (val._id && typeof val._id.$oid === "string") return val._id.$oid;
  }
  const str = String(val);
  return str === "[object Object]" ? fallback : str;
}

function extractBsonDate(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "string") return val;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "object" && val.$date) {
    if (typeof val.$date === "string") return val.$date;
    if (val.$date.$numberLong) return new Date(Number(val.$date.$numberLong)).toISOString();
  }
  return new Date().toISOString();
}

export async function GET(req: NextRequest) {
  try {
    const db = prisma as any;

    const rawRes: any = await db.$runCommandRaw({
      aggregate: "EscrowLock",
      pipeline: [
        { $sort: { createdAt: -1, _id: -1 } },
        { $limit: 50 },
        {
          $project: {
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
            updatedAt: 1,
          },
        },
      ],
      cursor: {},
    }).catch(() => null);

    const rawBatch = rawRes?.cursor?.firstBatch || [];

    const formatted = rawBatch.map((doc: any) => {
      const amountPi = Number(doc.amount || 0);
      const amountMbzr = amountPi * 1000;
      const rawId = extractBsonString(doc._id, "");

      return {
        id: rawId,
        escrowId: doc.escrowId || `ESC_${rawId.slice(-6)}`,
        consumerUid: extractBsonString(doc.consumerUid, "usr_pioneer"),
        providerId: extractBsonString(doc.providerId, "usr_provider"),
        amountPi,
        amountMbzr,
        token: doc.token || "PI",
        status: doc.status || "LOCKED",
        expiresAt: extractBsonDate(doc.timelockExpiresAt),
        createdAt: extractBsonDate(doc.createdAt),
        serviceDescription: doc.serviceDescription || "E-Network Merchant Escrow Lock",
      };
    });

    return NextResponse.json(
      {
        success: true,
        count: formatted.length,
        escrows: formatted,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[ESCROW_LIST_CRASH]:", err);
    return NextResponse.json({ success: true, count: 0, escrows: [] }, { status: 200 });
  }
}