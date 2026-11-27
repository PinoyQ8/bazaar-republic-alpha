import { NextRequest, NextResponse } from "next/server";
import { getMeshServerEnv } from "@/lib/pi/paymentEnv";
import {
  completePiPayment,
  fetchAndAssertPiPaymentNetwork,
} from "@/lib/pi/piPlatform";
import { settleConfirmedPiPayment } from "@/lib/pi/settlementHook";

export const dynamic = "force-dynamic";

const HARD_PERSISTENCE_WARNING_PREFIXES = [
  "PRISMA_CLIENT_UNAVAILABLE",
  "PAYMENT_UPSERT_FAILED:",
  "ESCROW_UPDATE_FAILED:",
  "MESH_LEDGER_FAILED:",
  "AUDIT_LOG_FAILED:",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const paymentId =
      typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
    const txid = typeof body?.txid === "string" ? body.txid.trim() : "";
    const escrowId =
      typeof body?.escrowId === "string" && body.escrowId.trim()
        ? body.escrowId.trim()
        : null;
    const rawUid =
      typeof body?.pioneerUid === "string" && body.pioneerUid.trim()
        ? body.pioneerUid.trim()
        : typeof body?.uid === "string" && body.uid.trim()
        ? body.uid.trim()
        : null;
    const merchantUid =
      typeof body?.merchantUid === "string" && body.merchantUid.trim()
        ? body.merchantUid.trim()
        : null;

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

    const rawAmount =
      typeof paymentObj?.amount === "number" ||
      typeof paymentObj?.amount === "string"
        ? paymentObj.amount
        : typeof body?.amount === "number" || typeof body?.amount === "string"
        ? body.amount
        : null;

    const settlement = await settleConfirmedPiPayment({
      paymentId,
      txid,
      network: env.network,
      realm: env.realm,
      escrowId,
      pioneerUid: rawUid,
      merchantUid,
      amount: rawAmount,
      rawPayment: paymentObj,
    });

    if (settlement.nodeFrozen) {
      console.warn("[API_PAYMENTS_COMPLETE] Settlement blocked for frozen node:", {
        paymentId,
        txid,
        pioneerUid: rawUid,
        warnings: settlement.warnings,
      });
      return NextResponse.json(
        {
          success: false,
          network: env.network,
          realm: env.realm,
          networkLabel: env.networkLabel,
          txid,
          error: "Settlement blocked: Pioneer node is frozen.",
          settlement,
          payment: completed.data,
        },
        { status: 403 }
      );
    }

    const hasHardPersistenceFailure = settlement.warnings.some((w) =>
      HARD_PERSISTENCE_WARNING_PREFIXES.some((prefix) => w.startsWith(prefix))
    );

    if (hasHardPersistenceFailure) {
      console.warn("[API_PAYMENTS_COMPLETE] Partial settlement failure:", {
        paymentId,
        txid,
        escrowId,
        warnings: settlement.warnings,
      });
      return NextResponse.json(
        {
          success: false,
          network: env.network,
          realm: env.realm,
          networkLabel: env.networkLabel,
          txid,
          error:
            "Payment completed with Pi Platform, but settlement persistence encountered partial failure.",
          settlement,
          payment: completed.data,
        },
        { status: 502 }
      );
    }

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
    console.error("[API_PAYMENTS_COMPLETE_ERROR]:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}