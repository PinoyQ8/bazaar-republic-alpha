// Location: app/api/notifications/operator-alert/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PI_IN_APP_NOTIFICATIONS_URL =
  "https://api.minepi.com/v2/in_app_notifications/notify";
const MAX_BATCH_SIZE = 256;

export type OperatorAlertKind = "SECURITY_UPDATE" | "MAJOR_UPGRADE";

export interface OperatorAlertPayload {
  kind: OperatorAlertKind;
  title: string;
  body: string;
  operatorUids: string[];
  subroute?: string;
}

function isAuthorizedOperatorRequest(req: NextRequest): boolean {
  const expectedKey =
    process.env.OPERATOR_ALERT_KEY?.trim() ||
    process.env.MESH_HARDWARE_KEY?.trim() ||
    process.env.PI_API_KEY?.trim() ||
    "";

  if (!expectedKey) {
    return false;
  }

  const headerKey =
    req.headers.get("x-mesh-hardware-key")?.trim() ||
    req.headers.get("x-operator-key")?.trim() ||
    "";

  const authHeader = req.headers.get("authorization")?.trim() || "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  return headerKey === expectedKey || bearerToken === expectedKey;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorizedOperatorRequest(req)) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED_OPERATOR_ALERT",
          message: "Valid operator authorization credential is required.",
        },
        { status: 401 }
      );
    }

    const piApiKey = process.env.PI_API_KEY?.trim();
    if (!piApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_PI_API_KEY",
          message: "PI_API_KEY is not configured in server environment.",
        },
        { status: 500 }
      );
    }

    const rawBody = (await req.json().catch(() => null)) as
      | Partial<OperatorAlertPayload>
      | null;

    if (!rawBody) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
        { status: 400 }
      );
    }

    const kind = rawBody.kind;
    if (kind !== "SECURITY_UPDATE" && kind !== "MAJOR_UPGRADE") {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_ALERT_KIND",
          message:
            "In-app operator alerts are restricted to kind 'SECURITY_UPDATE' or 'MAJOR_UPGRADE'.",
        },
        { status: 400 }
      );
    }

    const titleText =
      typeof rawBody.title === "string" ? rawBody.title.trim() : "";
    const bodyText = typeof rawBody.body === "string" ? rawBody.body.trim() : "";
    const rawUids = Array.isArray(rawBody.operatorUids)
      ? rawBody.operatorUids
      : [];

    const uniqueUids = Array.from(
      new Set(
        rawUids
          .filter((uid): uid is string => typeof uid === "string")
          .map((uid) => uid.trim())
          .filter(Boolean)
      )
    );

    if (!titleText || !bodyText || uniqueUids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_REQUIRED_FIELDS",
          message:
            "title, body, and a non-empty operatorUids array are required.",
        },
        { status: 400 }
      );
    }

    const requestedSubroute =
      typeof rawBody.subroute === "string" && rawBody.subroute.trim()
        ? rawBody.subroute.trim()
        : "/mesh/node";

    if (!requestedSubroute.startsWith("/")) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_SUBROUTE",
          message: "subroute must start with '/'.",
        },
        { status: 422 }
      );
    }

    const prefix = kind === "SECURITY_UPDATE" ? "[SECURITY]" : "[UPGRADE]";
    const formattedTitle = `${prefix} ${titleText}`.slice(0, 120);
    const formattedBody = bodyText.slice(0, 320);

    const notifications = uniqueUids.map((user_uid) => ({
      title: formattedTitle,
      body: formattedBody,
      user_uid,
      subroute: requestedSubroute,
    }));

    const deliveredNotifications: unknown[] = [];

    for (let i = 0; i < notifications.length; i += MAX_BATCH_SIZE) {
      const batch = notifications.slice(i, i + MAX_BATCH_SIZE);

      const piRes = await fetch(PI_IN_APP_NOTIFICATIONS_URL, {
        method: "POST",
        headers: {
          Authorization: `Key ${piApiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ notifications: batch }),
      });

      const piData = await piRes.json().catch(() => ({}));

      if (!piRes.ok) {
        return NextResponse.json(
          {
            success: false,
            error: piData?.error || "PI_NOTIFICATION_DISPATCH_FAILED",
            details: piData,
            deliveredSoFar: deliveredNotifications.length,
          },
          { status: piRes.status }
        );
      }

      if (Array.isArray(piData?.delivered_notifications)) {
        deliveredNotifications.push(...piData.delivered_notifications);
      }
    }

    return NextResponse.json(
      {
        success: true,
        kind,
        subroute: requestedSubroute,
        targetedCount: uniqueUids.length,
        deliveredCount: deliveredNotifications.length,
        delivered_notifications: deliveredNotifications,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error dispatching operator alert.";
    return NextResponse.json(
      { success: false, error: "OPERATOR_ALERT_ERROR", message },
      { status: 500 }
    );
  }
}