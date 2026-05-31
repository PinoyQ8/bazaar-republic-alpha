import { NextResponse } from "next/server";
import { neonClient } from "@/lib/neo-client"; // 🛡️ ADD THIS LINE TO FIX THE 'CANNOT FIND NAME' ERROR

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { citizenUid } = body;

    if (!citizenUid) {
      return NextResponse.json({ status: "ERROR", message: "Missing Citizen UID" }, { status: 400 });
    }

    // 🛡️ MESH-SCAN: Check for existing active STASIS using the imported client
    const activeStasis = await neonClient.recoveryLedger.findFirst({
      where: {
        citizenUid,
        status: 'STASIS',
      },
    });

    if (activeStasis) {
      return NextResponse.json({ status: "STASIS_ACTIVE", activeStasis }, { status: 200 });
    }

    // If no stasis, proceed with recovery logic execution...
    return NextResponse.json({ status: "PROCEED" }, { status: 200 });

  } catch (error: any) {
    console.error("[MESH-SCAN] Recovery Logic Fracture:", error.message);
    return NextResponse.json({ status: "FRACTURE", message: "Internal recovery ledger failed." }, { status: 500 });
  }
}
