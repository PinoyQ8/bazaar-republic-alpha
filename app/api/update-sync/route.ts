import { NextResponse } from 'next/server';
import { connectToUplink } from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { wallet_address } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'NODE_IDENTITY_MISSING' }, { status: 400 });
    }

    // 1. Establish Secure Handshake
    const db = await connectToUplink();
    const collection = db.collection("pioneer_registry");

    // 2. Locate Pioneer in the Data Fortress
    const pioneer = await collection.findOne({ wallet_address });

    if (!pioneer) {
      return NextResponse.json({ error: 'LEDGER_VOID' }, { status: 404 });
    }

    // 3. Mutate L_sync (Max Logic Alignment = 1.0 or 100%)
    const updatedQuadrants = {
      ...pioneer.quadrants,
      L_sync: { score: 1.0, last_updated: new Date().toISOString() }
    };

    // 4. Recalculate Master TrustScore
    const P = updatedQuadrants.P_align?.score || 0.25;
    const S = updatedQuadrants.S_stake?.score || 0.25;
    const C = updatedQuadrants.C_eco?.score || 0.25;
    const L = updatedQuadrants.L_sync.score;
    
    const calculated_ts = (P + S + C + L) / 4;
    const governance_eligible = calculated_ts >= 0.90;

    // 5. Commit Mutation to Blockchain/Ledger
    await collection.updateOne(
      { wallet_address },
      { 
        $set: { 
          quadrants: updatedQuadrants,
          calculated_ts,
          governance_eligible,
          last_sync: new Date().toISOString()
        } 
      }
    );

    return NextResponse.json({ 
      status: 'LEDGER_UPDATED', 
      new_ts: calculated_ts,
      governance_eligible 
    });

  } catch (error) {
    console.error("❌ MESH-SCAN: Backend Forge Failed", error);
    return NextResponse.json({ error: 'VAULT_ACCESS_FAILED' }, { status: 500 });
  }
}