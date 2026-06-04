import { NextResponse } from "next/server";
import { prisma } from "../../../../prisma/client"; // 🛡️ Linked directly to your unified MongoDB ledger

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { citizenUid } = body;

    if (!citizenUid) {
      return NextResponse.json({ status: "ERROR", message: "Missing Citizen UID" }, { status: 400 });
    }

    console.log(`[MESH-SCAN] Interrogating node status for recovery tracking: ${citizenUid}`);

    // 🛡️ REALIGNED INTEGRATION LAYER
    // Instead of querying a separate recovery table, we check the node's native status field inside MongoDB
    const pioneerNode = await prisma.pioneerNode.findUnique({
      where: {
        username: citizenUid, // Aligned to your schema's strict @unique username field
      },
    });

    if (!pioneerNode) {
      return NextResponse.json(
        { status: "NOT_FOUND", message: "Pioneer identity container not registered in the MESH." },
        { status: 404 }
      );
    }

    // 🛡️ Evaluate if the node is already locked down in an active STASIS state
    const isStasisActive = pioneerNode.status === "STASIS";

    if (isStasisActive) {
      console.warn(`[SECURITY ALERT] Node ${citizenUid} is already locked down in STASIS.`);
      return NextResponse.json({ 
        status: "STASIS_ACTIVE", 
        activeStasis: {
          id: pioneerNode.id,
          username: pioneerNode.username,
          status: pioneerNode.status,
          lastActivity: pioneerNode.lastActivityTimestamp
        } 
      }, { status: 200 });
    }

    // If no stasis, proceed with recovery logic execution...
    console.log(`[MESH-RECOVERY] Node ${citizenUid} status clear. Primed for recovery sequence.`);
    return NextResponse.json({ status: "PROCEED" }, { status: 200 });

  } catch (error: any) {
    console.error("[MESH-SCAN] Recovery Logic Fracture:", error?.message || error);
    return NextResponse.json({ status: "FRACTURE", message: "Internal recovery ledger failed." }, { status: 500 });
  }
}