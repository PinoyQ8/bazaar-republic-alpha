import { NextResponse } from "next/server";
import { neonClient } from "@/lib/neo-client"; // 🛡️ Hooked directly to your verified Prisma 7 singleton

export async function GET(request: Request) {
  // 🛡️ GATE 0: RUNTIME CONDUIT CHECK (Bypasses Next.js Build Workers)
  if (!process.env.NEON_DATABASE_URL) {
    console.error("[MESH-SCAN] Critical Failure: NEON_DATABASE_URL environment key missing.");
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

    // 2. 🛡️ REPAIRED INTEGRATION LAYER
    // Targets the exact 'citizenPassport' table populated during the registration upsert
    const passport = await neonClient.citizenPassport.findUnique({
      where: { 
        pioneerUid: uid 
      },
    });

    // 3. VALIDATE ENTRY EXISTENCE
    if (!passport) {
      return NextResponse.json(
        { status: "NOT_FOUND", message: "Pioneer Passport not initialized." }, 
        { status: 404 } // ⚡ MESH LAW: Standardized REST status for missing records
      );
    }

    // 4. SECURE PAYLOAD DELIVERY
    return NextResponse.json({ status: "SECURE", passport }, { status: 200 });

  } catch (error: any) {
    console.error("[MESH-SCAN] Passport Query Fracture:", error.message);
    return NextResponse.json(
      { status: "FRACTURE", message: "Internal ledger synchronization failure." }, 
      { status: 500 }
    );
  }
}
