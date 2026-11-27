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
    const txid = typeof body?.txid === "string" ? body.txid.trim() : "";
    const escrowId =
      typeof body?.escrowId === "string" ? body.escrowId.trim() : null;
    const pioneerUid =
      typeof body?.pioneerUid === "string" ? body.pioneerUid.trim() : null;

    if (!paymentId || !txid) {
      return NextResponse.json(
        { success: false, error: "Both paymentId and txid are required." },
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

    const check = await fetchAndAssertPiPaymentNetwork(env, paymentId);
    if (!check.ok) {
      return NextResponse.json(
        {
          success: false,
          network: env.network,
          realm: env.realm,
          error: check.error,
        },
        { status: check.status === 409 ? 409 : 502 }
      );
    }

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
              : `Pi payment completion failed (HTTP ${completed.status}).`,
        },
        {
          status:
            completed.status >= 400 && completed.status < 600
              ? completed.status
              : 502,
        }
      );
    }

    const paymentObj =
      completed.data?.payment && typeof completed.data.payment === "object"
        ? (completed.data.payment as Record<string, unknown>)
        : completed.data;

    const settlement = await settleConfirmedPiPayment({
      paymentId,
      txid,
      network: env.network,
      realm: env.realm,
      escrowId,
      pioneerUid,
      amount:
        typeof paymentObj?.amount === "number" ||
        typeof paymentObj?.amount === "string"
          ? paymentObj.amount
          : null,
      rawPayment: paymentObj,
    });

    return NextResponse.json({
      success: true,
      network: env.network,
      realm: env.realm,
      networkLabel: env.networkLabel,
      txid,
      settlement,
      payment: completed.data,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Payment completion error.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}