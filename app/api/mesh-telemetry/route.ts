// Location: /app/api/mesh-telemetry/route.ts
import { NextResponse } from "next/server";
import { TrustScoreEngine, NodeTelemetry } from "@/app/utils/mesh-trustscore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized Node Request" }, { status: 401 });
    }

    // 🛡️ STEP 1: Fetch Raw Node Telemetry
    // In production, this queries your MongoDB ledger or local Docker daemon stats.
    // We are passing a structured payload matching a Pioneer with 95% Uptime and 45 TXs.
    const rawTelemetry: NodeTelemetry = {
      nodeId: uid,
      isKYCVerified: true,
      isNodeBound: true,
      rollingUptime30D: 0.95, // 95% Uptime
      txCount30D: 45,         // Active E-Network usage
      stakedPi: 1500,         // 1500 Pi locked in Node
      activePenalties: 0,
    };

    // 🛡️ STEP 2: Execute the TS Mathematical Engine
    const powerMatrix = TrustScoreEngine.calculatePowerMatrix(rawTelemetry);

    // 🛡️ STEP 3: Algorithmic Tier Resolution
    let calculatedTier = "Ghost";
    if (powerMatrix.trustScore >= 90) calculatedTier = "Genesis Group";
    else if (powerMatrix.trustScore >= 75) calculatedTier = "Merchant & Service Provider";
    else if (powerMatrix.trustScore >= 50) calculatedTier = "Citizen";

    // 🛡️ STEP 4: Transmit Payload to S23 Dashboard
    return NextResponse.json({
      ts: powerMatrix.trustScore,
      tier: calculatedTier,
      vBase: powerMatrix.breakdown.vBase,
      uShield: powerMatrix.breakdown.uShield,
      cFlow: powerMatrix.breakdown.cFlow,
      pSlash: powerMatrix.breakdown.pSlash,
      votingPower: powerMatrix.votingPower,
      status: "26.1.0 SYNCED",
    });

  } catch (error) {
    console.error("[MESH] Telemetry Sync Failure:", error);
    return NextResponse.json({ error: "Node Desync" }, { status: 500 });
  }
}