import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Hop-by-hop headers prohibited in fetch/HTTP2 specifications
const FORBIDDEN_FORWARD_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function handleGatewayRequest(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const rawPath = searchParams.get("path") || "";

  // 1. Map Gateway Target
  let serviceId = "";
  let targetHost = "";
  let targetPort = "";

  const isDocker = process.env.IS_DOCKER === "true";

  if (rawPath.startsWith("ai") || rawPath.includes("openclaw")) {
    serviceId = "openclaw-ai";
    targetHost = isDocker ? "bzr-openclaw-ai" : "127.0.0.1";
    targetPort = isDocker ? "80" : "8000";
  } else if (rawPath.startsWith("jira") || rawPath.includes("atlassian") || rawPath.includes("mcp")) {
    serviceId = "atlassian-mcp";
    targetHost = isDocker ? "bzr-atlassian-mcp" : "127.0.0.1";
    targetPort = isDocker ? "80" : "19000";
  } else {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_GATEWAY_PATH",
        message: "The requested path does not map to a recognized co-hosted sibling service.",
      },
      { status: 400 }
    );
  }

 // 2. Query Active Switch State (Raw MongoDB query bypassing model drift)
  let isEnabled = true;
  let serviceName = serviceId;

  try {
    const rawResult = (await prisma.$runCommandRaw({
      find: "NodeService",
      filter: { serviceId },
      limit: 1,
    })) as {
      cursor?: {
        firstBatch?: Array<{
          serviceId?: string;
          isEnabled?: boolean;
          name?: string;
        }>;
      };
    };

    const doc = rawResult?.cursor?.firstBatch?.[0];
    if (doc) {
      isEnabled = doc.isEnabled ?? true;
      serviceName = doc.name || serviceId;
    }
  } catch (dbError) {
    console.warn(`[GATEWAY_DB_WARN] Could not query switch state for ${serviceId}:`, dbError);
    isEnabled = true; // Fail open in development
  }

  // 3. Fallback when co-hosting is explicitly toggled OFF
  if (!isEnabled) {
    const acceptHeader = req.headers.get("accept") || "";
    if (acceptHeader.includes("text/html")) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Service Paused — Bazaar Republic Ingress Edge</title>
          <style>
            body { background: #0b0f19; color: #f3f4f6; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; max-width: 480px; text-align: center; }
            .badge { background: #1e1b4b; color: #a5b4fc; font-size: 12px; padding: 4px 12px; border-radius: 9999px; }
            h1 { font-size: 24px; margin: 16px 0 12px; }
            p { color: #9ca3af; font-size: 14px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Co-Hosting Paused</span>
            <h1>Service Unreachable</h1>
            <p>The Node Operator has paused co-hosting for <strong>${serviceName}</strong> to preserve node consensus and database resources.</p>
          </div>
        </body>
        </html>`,
        {
          status: 503,
          headers: { "Content-Type": "text/html", "Retry-After": "60" },
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "COHOSTING_DISABLED",
        message: `Co-hosting for service '${serviceId}' has been disabled by the node operator.`,
        serviceId,
        isEnabled: false,
      },
      { status: 503 }
    );
  }

  // 4. Build Upstream Target & Query Params
  let cleanSubPath = rawPath.replace(/^(ai|jira|atlassian)\/?/, "");
  if (cleanSubPath === "ping" || cleanSubPath === "") {
    cleanSubPath = "";
  } else {
    cleanSubPath = cleanSubPath.replace(/^\/+/, "");
  }

  const upstreamBase = `http://${targetHost}:${targetPort}/${cleanSubPath}`;
  const upstreamUrl = new URL(upstreamBase);

  // Preserve all downstream query parameters except the gateway 'path' parameter
  searchParams.forEach((value, key) => {
    if (key !== "path") {
      upstreamUrl.searchParams.append(key, value);
    }
  });

  // 5. Sanitize Headers & Stream Payload
  const forwardHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (!FORBIDDEN_FORWARD_HEADERS.has(lowerKey) && !lowerKey.startsWith("next-")) {
      forwardHeaders[key] = value;
    }
  });

  forwardHeaders["x-forwarded-for"] = req.headers.get("x-forwarded-for") || "127.0.0.1";
  forwardHeaders["x-forwarded-proto"] = req.headers.get("x-forwarded-proto") || "http";

  let bodyPayload: BodyInit | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const buffer = await req.arrayBuffer();
      if (buffer.byteLength > 0) bodyPayload = buffer;
    } catch {
      bodyPayload = undefined;
    }
  }

  let finalUrl = upstreamUrl.toString();

  try {
    const upstreamRes = await fetch(finalUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: bodyPayload,
      signal: AbortSignal.timeout(8000),
    });

    const resContentType = upstreamRes.headers.get("content-type") || "text/plain";
    const resData = await upstreamRes.arrayBuffer();

    return new NextResponse(resData, {
      status: upstreamRes.status,
      headers: {
        "Content-Type": resContentType,
        "Cache-Control": "no-store, max-age=0",
        "X-Powered-By": "Bazaar Ingress Edge",
      },
    });
  } catch (error: any) {
    const isTimeout = error.name === "TimeoutError" || error.code === "ETIMEDOUT";
    console.error(`[GATEWAY_PROXY_FAULT] Target: ${finalUrl} | Error:`, error.message);

    return NextResponse.json(
      {
        success: false,
        error: isTimeout ? "GATEWAY_TIMEOUT" : "GATEWAY_PROXY_ERROR",
        details: error?.message || "Failed to establish bridge connection with container upstream.",
        target: finalUrl,
      },
      { status: isTimeout ? 504 : 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleGatewayRequest(req);
}

export async function POST(req: NextRequest) {
  return handleGatewayRequest(req);
}

export async function PUT(req: NextRequest) {
  return handleGatewayRequest(req);
}

export async function DELETE(req: NextRequest) {
  return handleGatewayRequest(req);
}