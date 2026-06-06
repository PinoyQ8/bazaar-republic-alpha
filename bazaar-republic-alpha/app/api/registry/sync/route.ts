import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

// 🛡️ BAZAAR TECH: Permanently disable Vercel API caching for this route
export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    // 🛡️ PRISMA LOGIC: Extract verified nodes directly from the Ledger
    const registryDirectory = await prisma.pioneerNode.findMany({
      orderBy: {
        lastActivityTimestamp: 'desc' // Renders newest active nodes first
      }
    });

    return NextResponse.json({
      status: "REGISTRY_SYNC_SUCCESS",
      count: registryDirectory.length,
      directory: registryDirectory
    });

  } catch (error) {
    console.error("[ADJUDICATOR] Read-Path Fracture:", error);
    return NextResponse.json({ status: "FRACTURE", message: "Registry sync failed." }, { status: 500 });
  }
}