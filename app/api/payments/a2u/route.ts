import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PI_A2U_URL = "https://api.minepi.com/v2/payments";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Server API Key in server environment
    const apiKey = process.env.PI_API_KEY?.trim();
    if (!apiKey) {
      console.error("[A2U ROUTE ERROR] PI_API_KEY is not defined in environment.");
      return NextResponse.json(
        {
          success: false,
          error: "PI_API_KEY missing on server",
          code: "MISSING_API_KEY",
        },
        { status: 500 }
      );
    }

    // 2. Parse incoming payload safely
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      console.warn("[A2U ROUTE WARN] Request body empty or malformed JSON");
    }

    const rawAmount = body?.amount ?? 1.0;
    const amount = Number(rawAmount);
    const vaultId =
      typeof body?.vaultId === "string" && body.vaultId.trim()
        ? body.vaultId.trim()
        : "ALPHA";

    const providedUid =
      typeof body?.uid === "string"
        ? body.uid.trim()
        : typeof body?.targetUid === "string"
        ? body.targetUid.trim()
        : "";

    const devFallbackUid =
      process.env.NODE_ENV !== "production"
        ? "5f747bc9-1302-4135-a40d-af7880174f16"
        : "";

    const targetUid = providedUid || devFallbackUid;

    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: "Recipient Pioneer uid is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payout amount requested. Must be > 0." },
        { status: 400 }
      );
    }

    const appId =
      process.env.PI_APP_ID || process.env.NEXT_PUBLIC_PI_APP_ID || undefined;

    console.log(
      `[A2U ROUTE] Sending ${amount} PI payout to UID: ${targetUid} (vault: ${vaultId})`
    );

    // 3. Dispatch A2U payment request to Pi Platform API with 8s timeout guard
    let piResponse: Response;
    try {
      piResponse = await fetch(PI_A2U_URL, {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          payment: {
            amount,
            memo: `Bazaar Vault ${vaultId} Settlement (PI)`,
            metadata: {
              ...(appId ? { appId } : {}),
              vaultId,
              asset: "PI",
              currency: "PI",
              type: "A2U_ESCROW_RELEASE",
            },
            uid: targetUid,
          },
        }),
      });
    } catch (networkError: any) {
      console.error(
        "[A2U NETWORK ERROR] Failed to connect to api.minepi.com:",
        networkError?.message || networkError
      );
      return NextResponse.json(
        {
          success: false,
          error: `Network failure contacting Pi Platform API: ${
            networkError?.message || "fetch failed"
          }`,
        },
        { status: 502 }
      );
    }

    // 4. Parse Pi Platform API response
    const paymentData = await piResponse.json().catch(() => ({}));

    if (!piResponse.ok) {
      console.error("[A2U PI API ERROR RESULT]", piResponse.status, paymentData);
      return NextResponse.json(
        {
          success: false,
          error:
            paymentData?.error_message ||
            paymentData?.message ||
            "Pi Platform API rejected transaction",
          details: paymentData,
        },
        { status: piResponse.status }
      );
    }

    // 5. Record PI payout in ledger
    try {
      const db = prisma as any;
      if (db?.auditLog?.create) {
        await db.auditLog.create({
          data: {
            action: "A2U_PAYOUT_SETTLEMENT",
            payload: JSON.stringify({
              targetUid,
              amount: String(amount),
              asset: "PI",
              txIdentifier: paymentData?.identifier || "A2U_TX_LOGGED",
            }),
            nodeId: vaultId,
            timestamp: new Date(),
          },
        });
      }
    } catch (dbErr: any) {
      console.warn(
        "[DB-WARN] Failed to write audit log, but payment succeeded:",
        dbErr?.message || dbErr
      );
    }

    return NextResponse.json({
      success: true,
      asset: "PI",
      amount,
      payment: paymentData,
    });
  } catch (fatalError: any) {
    console.error("[A2U UNHANDLED ROUTE CRASH]", fatalError);
    return NextResponse.json(
      {
        success: false,
        error: fatalError?.message || "Unhandled server exception",
      },
      { status: 500 }
    );
  }
}