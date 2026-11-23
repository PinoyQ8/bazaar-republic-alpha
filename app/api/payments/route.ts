import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PI_API_BASE = "https://api.minepi.com/v2/payments";

function getServerApiKey(): { key: string | null; error: string | null } {
  const raw = process.env.PI_API_KEY;
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return {
      key: null,
      error:
        "Server PI_API_KEY is missing or empty. Set PI_API_KEY in .env.local or Vercel Environment Variables and restart/redeploy the server.",
    };
  }
  return { key: raw.trim(), error: null };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Fail fast with a clear error when PI_API_KEY is missing on the server
    const { key: apiKey, error: keyError } = getServerApiKey();
    if (!apiKey) {
      console.error("[PI_PAYMENTS] MISSING_PI_API_KEY:", keyError);
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_PI_API_KEY",
          error: keyError,
        },
        { status: 500 }
      );
    }

    // 2. Parse and validate request payload
    let body: Record<string, unknown> | null = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_JSON",
          error: "Request body must be valid JSON.",
        },
        { status: 400 }
      );
    }

    const action = typeof body?.action === "string" ? body.action.trim() : "";
    const paymentId =
      typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
    const txid = typeof body?.txid === "string" ? body.txid.trim() : "";

    if (!paymentId) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_PAYMENT_ID",
          error: "paymentId is required.",
        },
        { status: 400 }
      );
    }

    // 3. Approve payment with Pi Platform API (Authorization: Key <PI_API_KEY>)
    if (action === "approve") {
      const piRes = await fetch(
        `${PI_API_BASE}/${encodeURIComponent(paymentId)}/approve`,
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
        console.error("[PI_PAYMENTS] Approve rejected:", piRes.status, data);
        return NextResponse.json(
          {
            success: false,
            code: piRes.status === 401 ? "PI_API_KEY_REJECTED" : "PI_APPROVE_FAILED",
            error: data?.message || `Pi Platform rejected approval (${piRes.status}).`,
            details: data,
          },
          { status: piRes.status }
        );
      }

      return NextResponse.json(
        { success: true, status: "approved", payment: data },
        { status: 200 }
      );
    }

    // 4. Complete payment with Pi Platform API after blockchain txid is submitted
    if (action === "complete") {
      if (!txid) {
        return NextResponse.json(
          {
            success: false,
            code: "MISSING_TXID",
            error: "txid is required to complete a Pi payment.",
          },
          { status: 400 }
        );
      }

      const piRes = await fetch(
        `${PI_API_BASE}/${encodeURIComponent(paymentId)}/complete`,
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
        console.error("[PI_PAYMENTS] Complete rejected:", piRes.status, data);
        return NextResponse.json(
          {
            success: false,
            code: piRes.status === 401 ? "PI_API_KEY_REJECTED" : "PI_COMPLETE_FAILED",
            error: data?.message || `Pi Platform rejected completion (${piRes.status}).`,
            details: data,
          },
          { status: piRes.status }
        );
      }

      return NextResponse.json(
        { success: true, status: "completed", paymentId, txid, payment: data },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        code: "INVALID_ACTION",
        error: "Invalid action. Expected 'approve' or 'complete'.",
      },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected error contacting Pi Platform.";
    console.error("[PI_PAYMENTS] Handler exception:", message);
    return NextResponse.json(
      {
        success: false,
        code: "PI_GATEWAY_ERROR",
        error: message,
      },
      { status: 502 }
    );
  }
}