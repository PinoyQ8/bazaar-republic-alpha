import { NextRequest, NextResponse } from "next/server";
import { getMeshServerEnv } from "@/lib/pi/paymentEnv";
import {
  completePiPayment,
  fetchAndAssertPiPaymentNetwork,
} from "@/lib/pi/piPlatform";
import { settleConfirmedPiPayment } from "@/lib/pi/settlementHook";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const paymentId =
      typeof body?.paymentId === "string" ? body.paymentId.trim() : "";

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Missing paymentId." },
        { status: 400 }
      );
    }

    const hostOrOrigin =
      req.headers.get("origin") ||
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host");

    const env = getMeshServerEnv({
      hostOrOrigin,
      explicitNetwork: typeof body?.network === "string" ? body.network : null,
      requireApiKey: true,
    });

    const inspected = await fetchAndAssertPiPaymentNetwork(env, paymentId);
    if (!inspected.ok || !inspected.payment) {
      return NextResponse.json(
        {
          success: false,
          network: env.network,
          realm: env.realm,
          error: inspected.error || "Unable to inspect incomplete payment.",
        },
        { status: inspected.status === 409 ? 409 : 502 }
      );
    }

    const payment = inspected.payment;
    const txid =
      typeof payment.transaction?.txid === "string"
        ? payment.transaction.txid.trim()
        : "";
    const alreadyCompleted = Boolean(payment.status?.developer_completed);

    if (!txid) {
      return NextResponse.json({
        success: true,
        action: "NO_TXID_YET",
        network: env.network,
        realm: env.realm,
        payment,
      });
    }

    if (!alreadyCompleted) {
      const completed = await completePiPayment(env, paymentId, txid);
      if (!completed.ok) {
        return NextResponse.json(
          {
            success: false,
            network: env.network,
            realm: env.realm,
            error:
              typeof completed.data?.error === "string"
                ? completed.data.error
                : `Incomplete payment completion failed (HTTP ${completed.status}).`,
          },
          {
            status:
              completed.status >= 400 && completed.status < 600
                ? completed.status
                : 502,
          }
        );
      }
    }

    const settlement = await settleConfirmedPiPayment({
      paymentId,
      txid,
      network: env.network,
      realm: env.realm,
      rawPayment: payment as Record<string, unknown>,
    });

    return NextResponse.json({
      success: true,
      action: alreadyCompleted
        ? "ALREADY_COMPLETED_SYNCED"
        : "COMPLETED_AND_SETTLED",
      network: env.network,
      realm: env.realm,
      txid,
      settlement,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Incomplete payment recovery error.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}