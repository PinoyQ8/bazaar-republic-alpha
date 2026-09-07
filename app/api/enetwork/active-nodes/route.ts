import { NextResponse } from "next/server";
import { ServiceProvider } from "@/lib/models/ServiceProvider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activeNodes = await (ServiceProvider as any)
      .find({ status: "ACTIVE" })
      .select("_id businessName serviceCategory registeredAt")
      .sort({ registeredAt: -1 });

    return NextResponse.json({
      success: true,
      nodes: activeNodes,
      count: activeNodes.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to query nodes" },
      { status: 500 }
    );
  }
}
