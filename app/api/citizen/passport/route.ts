import { NextResponse } from "next/server";
import { neonClient } from "@/lib/neo-client"; // 🛡️ Hooked directly to your verified Prisma 7 singleton

export async function GET(request: Request) {
  try {
    // 1. EXTRACT QUERY PARAMETERS
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ status: "ERROR", message: "UID parameter missing" }, { status: 400 });
    }

    // 2. 🛡️ REPAIRED INTEGRATION LAYER
    // Syntactically enclosed and routed away from the $connect engine hook.
    // NOTE: If 'pioneerPassport' flags an error, change it to your exact model name in camelCase (e.g., 'passport' or 'citizen')
    const passport = await neonClient.pioneer.findUnique({
      where: { 
        pioneerUid: uid 
      },
    });

    // 3. VALIDATE ENTRY EXISTENCE
    if (!passport) {
      return NextResponse.json({ status: "NOT_FOUND", message: "Pioneer Passport not initialized." }, { status: 444 });
    }

    return NextResponse.json({ status: "SECURE", passport }, { status: 200 });

  } catch (error: any) {
    console.error("[MESH-SCAN] Passport Query Fracture:", error.message);
    return NextResponse.json({ status: "FRACTURE", message: "Internal ledger synchronization failure." }, { status: 500 });
  }
}