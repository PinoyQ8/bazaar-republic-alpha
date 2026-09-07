// app/api/node/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const REGISTERED_SERVICES = [
  {
    serviceId: "openclaw-ai",
    name: "OpenClaw AI Worker",
    port: 8000,
    gatewayPath: "ai/ping",
  },
  {
    serviceId: "atlassian-mcp",
    name: "Atlassian MCP Bridge",
    port: 19000,
    gatewayPath: "jira/ping",
  },
];

export async function GET() {
  try {
    const rawResult = (await prisma.$runCommandRaw({
      find: "NodeService",
      filter: {},
    })) as {
      cursor?: {
        firstBatch?: Array<{
          serviceId: string;
          name?: string;
          isEnabled?: boolean;
          updatedAt?: string;
        }>;
      };
    };

    const records = rawResult?.cursor?.firstBatch || [];
    const stateMap = new Map(records.map((r) => [r.serviceId, r]));

    const services = REGISTERED_SERVICES.map((s) => {
      const record = stateMap.get(s.serviceId);
      return {
        ...s,
        isEnabled: record ? record.isEnabled ?? true : true,
        updatedAt: record?.updatedAt || null,
      };
    });

    return NextResponse.json({ success: true, services });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "FETCH_FAILED", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { serviceId, isEnabled } = await req.json();

    if (!serviceId || typeof isEnabled !== "boolean") {
      return NextResponse.json(
        { success: false, error: "INVALID_PAYLOAD", message: "serviceId and isEnabled are required." },
        { status: 400 }
      );
    }

    const matched = REGISTERED_SERVICES.find((s) => s.serviceId === serviceId);
    const serviceName = matched ? matched.name : serviceId;

    await prisma.$runCommandRaw({
      update: "NodeService",
      updates: [
        {
          q: { serviceId },
          u: {
            $set: {
              serviceId,
              isEnabled,
              updatedAt: new Date().toISOString(),
            },
            $setOnInsert: {
              name: serviceName,
              createdAt: new Date().toISOString(),
            },
          },
          upsert: true,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      serviceId,
      isEnabled,
      message: `Service '${serviceName}' is now ${isEnabled ? "ENABLED" : "PAUSED"}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "UPDATE_FAILED", details: error.message },
      { status: 500 }
    );
  }
}