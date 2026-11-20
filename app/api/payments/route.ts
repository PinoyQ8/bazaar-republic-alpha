import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PI_API_URL = "https://api.minepi.com/v2/payments";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.PI_API_KEY?.trim();
    if (!apiKey) {
      console.error("[PAYMENT_SERVER] PI_API_KEY missing in environment variables");
      return NextResponse.json(
        { success: false, error: "Server PI_API_KEY missing" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const action = typeof body?.action === "string" ? body.action.trim() : "";
    const paymentId =
      typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
    const txid = typeof body?.txid === "string" ? body.txid.trim() : "";

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "paymentId is required" },
        { status: 400 }
      );
    }

    // -----------------------------------------------------------------------
    // Phase I: Server Approval (Releases the native modal spinner)
    // -----------------------------------------------------------------------
    if (action === "approve") {
      console.log(`[PAYMENT_APPROVE] Sending approval to Pi Platform for: ${paymentId}`);

      const piRes = await fetch(
        `${PI_API_URL}/${encodeURIComponent(paymentId)}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${apiKey}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      const data = await piRes.json().catch(() => ({}));
      if (!piRes.ok) {
        console.error("[PAYMENT_APPROVE_ERROR] Pi Core rejected approval:", piRes.status, data);
        return NextResponse.json(
          { success: false, error: data?.message || "Approval rejected by Pi Core", details: data },
          { status: piRes.status }
        );
      }

      const numericAmount = Number(data?.amount ?? 0);
      console.log(`[PAYMENT_APPROVE_SUCCESS] Payment ${paymentId} approved (${numericAmount} PI)`);
      return NextResponse.json(
        { success: true, asset: "PI", amount: numericAmount, payment: data },
        { status: 200 }
      );
    }

    // -----------------------------------------------------------------------
    // Phase III: Server Completion (Settles on-chain transaction)
    // -----------------------------------------------------------------------
    if (action === "complete") {
      if (!txid) {
        return NextResponse.json(
          { success: false, error: "txid is required for completion" },
          { status: 400 }
        );
      }

      console.log(`[PAYMENT_COMPLETE] Finalizing on-chain txid ${txid} for: ${paymentId}`);

      const piRes = await fetch(
        `${PI_API_URL}/${encodeURIComponent(paymentId)}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ txid }),
          signal: AbortSignal.timeout(10000),
        }
      );

      const data = await piRes.json().catch(() => ({}));
      if (!piRes.ok) {
        console.error("[PAYMENT_COMPLETE_ERROR] Pi Core rejected completion:", piRes.status, data);
        return NextResponse.json(
          { success: false, error: data?.message || "Completion rejected by Pi Core", details: data },
          { status: piRes.status }
        );
      }

      const settledAmount = Number(data?.amount ?? 0);
      console.log(`[PAYMENT_COMPLETE_SUCCESS] Payment ${paymentId} completed (${settledAmount} PI)`);
      return NextResponse.json(
        {
          success: true,
          asset: "PI",
          amount: settledAmount,
          paymentId,
          txid,
          payment: data,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Invalid action parameter. Expected 'approve' or 'complete'." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[PAYMENT_SERVER_CRASH]", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal payment error" },
      { status: 502 }
    );
  }
}