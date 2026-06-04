import { NextResponse } from "next/server";
import { prisma } from "../../../../prisma/client"; // 🛡️ Linked directly to your unified MongoDB ledger

export async function GET(request: Request) {
  // 🛡️ GATE 0: RUNTIME CONDUIT CHECK (Bypasses Next.js Build Workers)
  if (!process.env.MONGODB_URI) {
    console.error("[MESH-SCAN] Critical Failure: MONGODB_URI environment vault token missing.");
    return NextResponse.json(
      { status: "ERROR", message: "Conduit Disconnected" }, 
      { status: 500 }
    );
  }

  try {
    // 1. EXTRACT QUERY PARAMETERS
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { status: "ERROR", message: "UID parameter missing" }, 
        { status: 400 }
      );
    }

    // 2. 🛡️ REALIGNED INTEGRATION LAYER
    // Targets the unified pioneerNode collection where the CITIZEN identity data is compiled
    const passport = await prisma.pioneerNode.findUnique({
      where: { 
        username: uid // Matches your schema's strict @unique username identifier
      },
    });

    // 3. VALIDATE ENTRY EXISTENCE
    if (!passport) {
      return NextResponse.json(
        { status: "NOT_FOUND", message: "Pioneer Passport identity frame not initialized." }, 
        { status: 404 } // ⚡ MESH LAW: Standard REST code for missing node blocks
      );
    }

    // 4. SECURE PAYLOAD DELIVERY
    return NextResponse.json({ status: "SECURE", passport }, { status: 200 });

  } catch (error: any) {
    console.error("[MESH-SCAN] Passport Query Fracture:", error?.message || error);
    return NextResponse.json(
      { status: "FRACTURE", message: "Internal ledger synchronization failure." }, 
      { status: 500 }
    );
  }
}