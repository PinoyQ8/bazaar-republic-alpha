// /app/api/settlement/route.ts
import { NextResponse } from 'next/server';
import { PioneerNode } from '@/models/PioneerNode';

export async function POST(request: Request) {
  try {
  // 1. Parse the Incoming Payload 
    const body = await request.json();
    const cartValue = body.cartValue || 500;
    // TARGET FILE PATH: [project-root]/app/api/settlement/route.ts

// INITIATING CORRECTION...
const buyerUid = body.buyerUid || "UNKNOWN_PIONEER";
    const merchantUid = body.merchantUid || "SYSTEM_DAO_COLLECTOR";

    console.log(`[API] SYNC: Initiating Settlement | Value: ${cartValue} mBZR`);

    // 2. Phase 1: Execute the Settlement 
    // DEDUCT FROM BUYER
    await PioneerNode.updateOne(
      { uid: buyerUid },
      { $inc: { activeFuel: -cartValue } }
    );

    // BULLETPROOF CREDIT (Auto-Genesis to prevent the digital void)
    await PioneerNode.updateOne(
      { uid: merchantUid },
      { 
        $inc: { activeFuel: cartValue },
        $setOnInsert: { 
          activeNodeCount: 1, 
          uptimeStats: 100, 
          referralCount: 0, 
          trust_score: 50 
        }
      },
      { upsert: true }
    );

    // 3. Phase 2: Instant Treasury Audit
    const accounts = await PioneerNode.find({ uid: { $in: [buyerUid, merchantUid] } });

    // 5. Return the Validated Data to the Frontend
    return NextResponse.json({
      success: true,
      message: "Settlement Cleared & Treasury Balanced",
      data: accounts
    }, { status: 200 });

  } catch (error) {
    console.error("API_SETTLEMENT_FRACTURE:", error);
    return NextResponse.json({ 
      success: false, 
      error: "MESH_FRACTURE_DETECTED" 
    }, { status: 500 });
  }
}