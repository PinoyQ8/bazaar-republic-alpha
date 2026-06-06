import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NodeStatus } from "@prisma/client";

// 🛑 ARCHITECTURAL NOTE: Real production apps must use Redis (Upstash) 
// for rate limiting. This logic remains Alpha-Track only.

export async function POST(req: Request) {
  try {
    // 0. PERIMETER SHIELD
    const origin = req.headers.get("origin") || "";
    const isVercel = origin.includes("mesh-academy-alpha.vercel.app");
    
    if (!isVercel && process.env.NODE_ENV === "production") {
      return NextResponse.json({ success: false, message: "UNAUTHORIZED_ORIGIN" }, { status: 403 });
    }

    // 1. PAYLOAD EXTRACTION
    const { accessToken } = await req.json();
    if (!accessToken) return NextResponse.json({ success: false, message: "MISSING_TOKEN" }, { status: 400 });

    // 2. PI NETWORK HANDSHAKE (Server-to-Server Verification)
    const piResponse = await fetch("https://api.minepi.com/v2/me", {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });

    if (!piResponse.ok) {
      return NextResponse.json({ success: false, message: "INVALID_PI_TOKEN" }, { status: 401 });
    }

    const { uid, username } = await piResponse.json();

    // 3. LEDGER INTEGRITY CHECK (The Governance Gate)
    const node = await prisma.pioneerNode.findUnique({ where: { uid } });

    if (!node) {
      // Auto-register if new
      await prisma.pioneerNode.create({
        data: { uid, username, status: NodeStatus.ACTIVE }
      });
    } else {
      // 🛡️ THE FREEZE GATE: Deny access if sanctioned
      if (node.isFrozen) {
        return NextResponse.json(
          { success: false, message: `ACCESS_DENIED: NODE_FROZEN. Reason: ${node.freezeReason || "Violation of Protocol"}` }, 
          { status: 403 }
        );
      }
    }

    // 4. HANDSHAKE SUCCESS
    return NextResponse.json({
      success: true,
      message: "GATEKEEPER_SUCCESS",
      node: { uid, username, status: "ACTIVE" }
    });

  } catch (error) {
    console.error("[GATEKEEPER] Critical Fracture:", error);
    return NextResponse.json({ success: false, message: "INTERNAL_FRACTURE" }, { status: 500 });
  }
}