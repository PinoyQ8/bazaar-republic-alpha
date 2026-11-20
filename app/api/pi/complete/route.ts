import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PI_API_BASE = "https://api.minepi.com/v2";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.PI_API_KEY?.trim();
    if (!apiKey) {
      console.error("[PI-COMPLETE] PI_API_KEY is missing in server environment.");
      return NextResponse.json(
        { success: false, error: "Server PI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const paymentId =
      typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
    const txid = typeof body?.txid === "string" ? body.txid.trim() : "";

    if (!paymentId || !txid) {
      return NextResponse.json(
        { success: false, error: "Both paymentId and txid are required." },
        { status: 400 }
      );
    }

    console.log(`[PI-COMPLETE] Completing payment ${paymentId} with txid ${txid}...`);

    const piRes = await fetch(
      `${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txid }),
        signal: AbortSignal.timeout(8000),
      }
    );

    const data = await piRes.json().catch(() => ({}));
    if (!piRes.ok) {
      console.error("[PI-COMPLETE REJECTED]", piRes.status, data);
      return NextResponse.json(
        {
          success: false,
          error: data?.message || "Pi Platform rejected payment completion.",
          details: data,
        },
        { status: piRes.status }
      );
    }

    // Record PI settlement idempotently after Pi Platform confirms completion
    const verifiedAmount = Number(data?.amount ?? 0);
    try {
      const db = prisma as any;
      if (db.ledgerLog) {
        const existing = await db.ledgerLog.findFirst({
          where: { txHash: txid },
        });
        if (!existing) {
          await db.ledgerLog.create({
            data: {
              uid: data?.user_uid || "UNKNOWN_PIONEER",
              amount: String(verifiedAmount),
              asset: "PI",
              txHash: txid,
              status: "COMPLETED",
            },
          });
        }
      }
    } catch (dbErr: any) {
      console.warn("[PI-COMPLETE DB WARN]", dbErr?.message || dbErr);
    }

    return NextResponse.json({
      success: true,
      asset: "PI",
      paymentId,
      txid,
      payment: data,
    });
  } catch (err: any) {
    console.error("[PI-COMPLETE CRASH]", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal error completing Pi payment." },
      { status: 500 }
    );
  }
}