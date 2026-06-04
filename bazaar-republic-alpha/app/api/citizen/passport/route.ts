import { NextResponse } from "next/server";
import { prisma } from "@/lib/mesh-prisma"; // 🛡️ MESH ALIGNED: Unified path

// 🛡️ NEO PROTOCOL: Prevent build-time pre-rendering
// This ensures the code ONLY runs on the server at request time.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 🛡️ MESH CONDUIT CHECK: Standardized to DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error("[MESH-SCAN] Critical Failure: DATABASE_URL missing from environment.");
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
    const passport = await prisma.pioneerNode.findUnique({
      where: { 
        username: uid 
      },
    });

    // 3. VALIDATE ENTRY EXISTENCE
    if (!passport) {
      return NextResponse.json(
        { status: "NOT_FOUND", message: "Pioneer Passport identity frame not initialized." }, 
        { status: 404 } 
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