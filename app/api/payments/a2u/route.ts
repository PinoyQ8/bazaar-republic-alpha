import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PI_API_V2 = "https://api.minepi.com/v2";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.PI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "PI_API_KEY is missing on server", code: "MISSING_API_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount);
    const vaultId =
      typeof body?.vaultId === "string" && body.vaultId.trim()
        ? body.vaultId.trim()
        : "ALPHA";
    const targetUid =
      typeof body?.uid === "string" && body.uid.trim()
        ? body.uid.trim()
        : typeof body?.recipientUid === "string" && body.recipientUid.trim()
          ? body.recipientUid.trim()
          : "";
    const providedTxid =
      typeof body?.txid === "string" && body.txid.trim() ? body.txid.trim() : "";

    if (!targetUid || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid uid and positive amount are required." },
        { status: 400 }
      );
    }

    const db = prisma as any;
    if (db?.pioneerNode?.findFirst) {
      const node = await db.pioneerNode.findFirst({
        where: { OR: [{ uid: targetUid }, { username: targetUid }] },
      });
      if (node?.isFrozen || node?.status === "QUARANTINED") {
        return NextResponse.json(
          { success: false, error: "Recipient Pioneer is frozen or quarantined." },
          { status: 403 }
        );
      }
    }

    const createRes = await fetch(`${PI_API_V2}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        payment: {
          amount,
          memo: `Bazaar Vault ${vaultId} A2U Settlement`,
          metadata: { vaultId, type: "A2U_ESCROW_RELEASE", asset: "PI" },
          uid: targetUid,
        },
      }),
    });

    const createData = await createRes.json().catch(() => ({}));
    if (!createRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: createData?.error_message || createData?.message || "Pi Platform rejected A2U payment",
          details: createData,
        },
        { status: createRes.status }
      );
    }

    const paymentObj = createData?.payment || createData;
    const paymentId: string | undefined = paymentObj?.identifier;
    const txid = providedTxid || paymentObj?.transaction?.txid || "";

    let status = "CREATED";
    let completedPayment = paymentObj;

    if (paymentId && txid) {
      const completeRes = await fetch(`${PI_API_V2}/payments/${paymentId}/complete`, {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ txid }),
      });

      const completeData = await completeRes.json().catch(() => ({}));
      if (!completeRes.ok) {
        return NextResponse.json(
          {
            success: false,
            error: completeData?.error_message || completeData?.message || "Pi payment completion failed",
            paymentId,
            txid,
            details: completeData,
          },
          { status: completeRes.status }
        );
      }

      completedPayment = completeData?.payment || completeData;
      status = "COMPLETED";

      try {
        if (db?.auditLog?.create) {
          await db.auditLog.create({
            data: {
              action: "A2U_PAYOUT_COMPLETED",
              payload: JSON.stringify({
                paymentId,
                targetUid,
                amount,
                asset: "PI",
                txid,
                status,
              }),
              nodeId: vaultId,
              timestamp: new Date(),
            },
          });
        }
      } catch (dbErr) {
        console.warn("[A2U_AUDIT_WARN]:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      asset: "PI",
      paymentId,
      txid: txid || null,
      status,
      payment: completedPayment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Unhandled A2U route error" },
      { status: 500 }
    );
  }
}