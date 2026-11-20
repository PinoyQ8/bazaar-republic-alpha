import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PI_API_BASE = "https://api.minepi.com/v2";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.PI_API_KEY?.trim();
    if (!apiKey) {
      console.error("[PI-APPROVE] PI_API_KEY is missing in server environment.");
      return NextResponse.json(
        { success: false, error: "Server PI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const paymentId =
      typeof body?.paymentId === "string" ? body.paymentId.trim() : "";

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "paymentId is required." },
        { status: 400 }
      );
    }

    // 1. Inspect payment details on Pi Platform API before approving
    const inspectRes = await fetch(
      `${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    const inspectData = await inspectRes.json().catch(() => ({}));
    if (!inspectRes.ok) {
      console.error("[PI-APPROVE INSPECT FAILED]", inspectRes.status, inspectData);
      return NextResponse.json(
        {
          success: false,
          error: inspectData?.message || "Failed to verify payment with Pi Platform.",
          details: inspectData,
        },
        { status: inspectRes.status }
      );
    }

    const amount = Number(inspectData?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid PI payment amount." },
        { status: 400 }
      );
    }

    // 2. Approve payment with Pi Platform API
    console.log(`[PI-APPROVE] Approving ${amount} PI for paymentId: ${paymentId}`);
    const approveRes = await fetch(
      `${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    const approveData = await approveRes.json().catch(() => ({}));
    if (!approveRes.ok) {
      console.error("[PI-APPROVE REJECTED]", approveRes.status, approveData);
      return NextResponse.json(
        {
          success: false,
          error: approveData?.message || "Pi Platform rejected payment approval.",
          details: approveData,
        },
        { status: approveRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      asset: "PI",
      amount,
      payment: approveData,
    });
  } catch (err: any) {
    console.error("[PI-APPROVE CRASH]", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal error approving Pi payment." },
      { status: 500 }
    );
  }
}