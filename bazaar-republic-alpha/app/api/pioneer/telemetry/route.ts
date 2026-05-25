// 🛡️ MESH TELEMETRY: PIONEER ACCOUNT UPLINK (MongoDB)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { PioneerNode } from '@/lib/models/PioneerNode'; 

export async function GET(request: NextRequest) {
  try {
    // 1. IDENTITY INTERCEPT
    const uid = request.headers.get('x-mesh-pioneer-uid');

    if (!uid) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED_IDENTITY" }, { status: 401 });
    }

    await connectToLedger();

    // 2. VAULT EXTRACTION
    const nodeData = await PioneerNode.findOne({ uid }).lean();

    if (!nodeData) {
      return NextResponse.json({ success: false, error: "PIONEER_NOT_FOUND_IN_VAULT" }, { status: 404 });
    }

    // 3. THE SECURE HUD PAYLOAD
    return NextResponse.json({
      success: true,
      telemetry: {
        uid: nodeData.uid,
        username: nodeData.username,
        slotNumber: nodeData.slotNumber,
        trustScore: nodeData.trustScore,
        isFrozen: nodeData.isFrozen,
        stakedBalance: nodeData.stakedBalance || 0 
      }
    });

  } catch (error) {
    console.error("[MESH-TELEMETRY GET ERROR]:", error);
    return NextResponse.json({ success: false, error: "Ledger Read Failure" }, { status: 500 });
  }
}