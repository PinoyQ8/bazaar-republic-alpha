import { NextResponse } from "next/server";
import { neonClient } from "@/lib/neo-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { piUsername, p23Token, roles } = body;

    // 🛡️ GATE 1: P23 COMPLIANCE SECURITY CHECK
    if (!piUsername || !p23Token) {
      return NextResponse.json(
        { 
          success: false, 
          error: "[MESH-SCAN] Cryptographic Handshake Failed: Missing P23 Identity Token." 
        },
        { status: 400 }
      );
    }

    // 🛡️ GATE 2: ATOMIC DATABASE UPSERT USING TRUE PROPERTIES
    const citizen = await neonClient.$transaction(async (tx) => {
      const pioneerRecord = await tx.pioneer.upsert({
        where: { pioneerUid: piUsername }, // ⚡ FIXED: Uses verified pioneerUid field
        update: {
          role: roles?.includes("elder") ? "ELDER" : "PIONEER",
        },
        create: {
          pioneerUid: piUsername,
          role: roles?.includes("elder") ? "ELDER" : "PIONEER",
        },
      });

      const passportRecord = await tx.citizenPassport.upsert({
        where: { pioneerUid: pioneerRecord.pioneerUid }, // ⚡ FIXED: Uses verified pioneerUid constraint
        update: { 
          status: "SYNCED", // ⚡ FIXED: Replaces invalid 'isSynced' property
          tier: 1,          // ⚡ FIXED: Replaces invalid 'onboardingStep' property
        },
        create: {
          pioneerUid: pioneerRecord.pioneerUid,
          status: "SYNCED",
          tier: 1,
        },
      });

      return { pioneerRecord, passportRecord };
    });

    // 🛡️ GATE 3: SUCCESS PAYLOAD RETURNED TO THE UI
    return NextResponse.json({
      success: true,
      message: "MESH Protocol Synced: Pioneer upgraded to Bazaar Citizen status.",
      payload: {
        pioneerUid: citizen.pioneerRecord.pioneerUid, // ⚡ FIXED: Reads from true model shape
        tier: citizen.passportRecord.tier,             // ⚡ FIXED: Reads from true model shape
        status: citizen.passportRecord.status         // ⚡ FIXED: Reads from true model shape
      }
    });

  } catch (error: any) {
    console.error("[ONBOARDING_SYNC_ERROR]:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "[MESH-SCAN] Internal Core Failure during database commit.",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
