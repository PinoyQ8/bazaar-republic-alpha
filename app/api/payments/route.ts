import { NextRequest, NextResponse } from "next/server";
import { getMeshServerEnv } from "@/lib/pi/paymentEnv";
import {
  approvePiPayment,
  completePiPayment,
  fetchAndAssertPiPaymentNetwork,
} from "@/lib/pi/piPlatform";
import { settleConfirmedPiPayment } from "@/lib/pi/settlementHook";

function resolveRequestEnv(req: NextRequest, explicitNetwork?: unknown) {
  const hostOrOrigin =
    req.headers.get("origin") ||
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host");

  return getMeshServerEnv({
    hostOrOrigin,
    explicitNetwork:
      typeof explicitNetwork === "string" ? explicitNetwork : null,
    requireApiKey: true,
  });
}

export async function GET(req: NextRequest) {
  const hostOrOrigin =
    req.headers.get("origin") ||
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host");

  const env = getMeshServerEnv({
    hostOrOrigin,
    requireApiKey: false,
  });

  return NextResponse.json({
    ok: true,
    network: env.network,
    realm: env.realm,
    networkLabel: env.networkLabel,
    sandbox: env.sandbox,
    endpoints: {
      approve: "/api/payments/approve",
      complete: "/api/payments/complete",
      incomplete: "/api/payments/incomplete",
      legacyActionRouter: "/api/payments",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action =
      typeof body?.action === "string" ? body.action.trim().toLowerCase() : "";
    const paymentId =
      typeof body?.paymentId === "string" ? body.paymentId.trim() : "";

    if (!action || !["approve", "complete", "incomplete"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported or missing action. Expected 'approve', 'complete', or 'incomplete'.",
        },
        { status: 400 }
      );
    }

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Missing paymentId." },
        { status: 400 }
      );
    }

    const env = resolveRequestEnv(req, body?.network);

    if (action === "approve") {
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

      const approved = await approvePiPayment(env, paymentId);
      if (!approved.ok) {
        return NextResponse.json(
          {
            success: false,
            network: env.network,
            realm: env.realm,
            error:
              typeof approved.data?.error === "string"
                ? approved.data.error
                : `Pi payment approval rejected (HTTP ${approved.status}).`,
          },
          {
            status:
              approved.status >= 400 && approved.status < 600
                ? approved.status
                : 502,
          }
        );
      }

      return NextResponse.json({
        success: true,
        action: "approve",
        network: env.network,
        realm: env.realm,
        networkLabel: env.networkLabel,
        payment: approved.data,
      });
    }

    if (action === "complete") {
      const txid = typeof body?.txid === "string" ? body.txid.trim() : "";
      const escrowId =
        typeof body?.escrowId === "string" ? body.escrowId.trim() : null;
      const pioneerUid =
        typeof body?.pioneerUid === "string" ? body.pioneerUid.trim() : null;

      if (!txid) {
        return NextResponse.json(
          { success: false, error: "Missing txid for payment completion." },
          { status: 400 }
        );
      }

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
        action: "complete",
        network: env.network,
        realm: env.realm,
        networkLabel: env.networkLabel,
        txid,
        settlement,
        payment: completed.data,
      });
    }

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
      err instanceof Error ? err.message : "Payment route error.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}