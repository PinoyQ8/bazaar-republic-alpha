import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("[MESH-SCAN] Polling Ledger for pending Pioneer Nodes...");

    // 🛡️ THE BAZAAR FIX: Purged Mongoose, executing strict Prisma query.
    // We target all nodes currently trapped in the default "SYNCING" state.
    const pendingNodes = await prisma.pioneerNode.findMany({
      where: {
        status: "SYNCING", 
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`[LEDGER READ] Found ${pendingNodes.length} nodes awaiting synchronization.`);
    
    return NextResponse.json({ 
      success: true, 
      count: pendingNodes.length, 
      nodes: pendingNodes 
    });

  } catch (error) {
    console.error("[MESH FRACTURE] Ledger Read Failed:", error);
    return NextResponse.json(
      { success: false, error: "Database Link Severed" }, 
      { status: 500 }
    );
  }
}