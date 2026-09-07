import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { ServiceProvider } from "@/lib/models/ServiceProvider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Establish serverless MongoDB connection
    await dbConnect();

    // 2. Query active directory nodes
    const activeNodes = await (ServiceProvider as any)
      .find({ status: "ACTIVE" })
      .select("_id businessName serviceCategory registeredAt")
      .sort({ registeredAt: -1 });

    return NextResponse.json({
      success: true,
      nodes: activeNodes || [],
      count: activeNodes?.length || 0,
    });
  } catch (error: any) {
    console.error("[ACTIVE_NODES_FRACTURE]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_MESH_FRACTURE",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
