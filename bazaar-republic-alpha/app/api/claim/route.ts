import { NextResponse } from "next/server";
import { prisma } from "@/lib/mesh-prisma";

// 🛡️ NEO PROTOCOL: Hard-lock to dynamic execution
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // ... (rest of your logic)
  try {
    const body = await request.json();
    const { cleanAddress } = body; // 🛡️ Ensure scope is here

    // 1. Fetching the pioneer record
    const pioneerRecord = await prisma.pioneerNode.findFirst({
      where: { walletAddress: cleanAddress },
    });

    if (!pioneerRecord) {
      return NextResponse.json({ error: "Pioneer not found" }, { status: 404 });
    }

    // 🛡️ Logic using 'pioneerRecord' instead of 'pioneer'
    console.log("Pioneer data:", pioneerRecord.username);

    // ... (rest of your logic) ...

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[MESH-CRITICAL] Claim Failure:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } // 🛡️ Brace closed correctly
} // 🛡️ Function closed correctly