import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { Proposal } from '@/models/proposal'; 

export async function GET() {
  try {
    console.log("[MESH-SYNC] 📡 Viewport requesting Ledger data...");
    await connectToLedger();
    
    // 🛡️ THE MESH BYPASS: Fetching all payloads regardless of strict-mode status stripping
    const activeProposals = await Proposal.find().sort({ createdAt: -1 }); 

    console.log(`[MESH-SYNC] ✅ Successfully retrieved ${activeProposals.length} active payloads.`);

    return NextResponse.json({ 
      status: "SYNC_COMPLETE", 
      proposals: activeProposals 
    }, { status: 200 });

  } catch (error) {
    console.error("[MESH-GET FRACTURE]", error);
    return NextResponse.json({ status: "FRACTURE", message: "Failed to read from the Ledger." }, { status: 500 });
  }
}