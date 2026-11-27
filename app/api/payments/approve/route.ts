import { NextRequest, NextResponse } from "next/server";
import { getMeshServerEnv } from "@/lib/pi/paymentEnv";
import {
  approvePiPayment,
  fetchAndAssertPiPaymentNetwork,
} from "@/lib/pi/piPlatform";

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
      network: env.network,
      realm: env.realm,
      networkLabel: env.networkLabel,
      payment: approved.data,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Payment approval error.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}