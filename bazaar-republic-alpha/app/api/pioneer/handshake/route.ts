// Route: /app/api/pioneer/handshake/route.ts
// Logic: Zero-Trust Pioneer Authentication Bridge (MESH Hardened)

import { NextResponse } from "next/server";
// 🛡️ MESH-SYNC: Unified ledger connection to prevent connection pooling fractures
import { connectToLedger } from "@/lib/mongodb"; 
import { resolvePioneer } from "@/lib/pioneer-registry";

export async function POST(req: Request) {
  try {
    // 1. Parse the Pi SDK payload
    const body = await req.json();
    const { uid } = body;

    // 2. Zero-Trust Shield: Block empty payloads, spaces, and Ghost Nodes
    if (!uid || uid === "GHOST_NODE" || uid.trim() === "") {
      return NextResponse.json(
        { success: false, error: "MESH-REJECT: Invalid or missing Pioneer UID." },
        { status: 401 } // 401 Unauthorized
      );
    }

    // 3. Establish strict connection to the DAO Ledger
    await connectToLedger();

    // 4. Execute the Bridge Handshake (Genesis Protocol handles creation in the registry)
    const pioneerAccount = await resolvePioneer(uid);

    if (!pioneerAccount) {
       return NextResponse.json(
        { success: false, error: "FATAL: Genesis registry failed to resolve or create node." },
        { status: 500 }
      );
    }

    // 5. Secure Uplink: Return the Synced Node with strict UI payload compliance
    return NextResponse.json(
      { 
        success: true,
        status: "SYNCED", 
        account: pioneerAccount 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[MESH-FRACTURE] Handshake Execution Failure:", error);
    return NextResponse.json(
      { success: false, error: "FATAL: Internal DAO Routing Error." },
      { status: 500 } // 500 Internal Server Error
    );
  }
}