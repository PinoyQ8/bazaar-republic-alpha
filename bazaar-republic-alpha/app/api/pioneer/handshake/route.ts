// app/api/pioneer/handshake/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { resolvePioneer } from "@/lib/pioneer-registry";

export async function POST(req: Request) {
  try {
    // 1. Parse the Pi SDK payload
    const body = await req.json();
    const { uid } = body;

    // Validate incoming data
    if (!uid) {
      return NextResponse.json(
        { error: "MESH_ERROR: UID payload missing." },
        { status: 400 }
      );
    }

    // 2. Establish Zero-Trust connection to the DAO Ledger
    await connectToDatabase();

    // 3. Execute the Bridge Handshake
    const pioneerAccount = await resolvePioneer(uid);

    // 4. Return the Synced Node to the Client
    return NextResponse.json(
      { 
        status: "SYNCED", 
        account: pioneerAccount 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[MESH-SCAN] Handshake Failure:", error);
    return NextResponse.json(
      { error: "Internal DAO Routing Error" },
      { status: 500 }
    );
  }
}