// 🛡️ MESH GOVERNANCE: MASTER INDEX (ACTIVE TELEMETRY)
import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { Proposal } from '@/lib/models/Proposal';

// 🛡️ PRE-FLIGHT LOCK: Disable static caching
// The DAO must reflect real-time ledger states. This prevents Turbopack from serving stale feed data.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToLedger();

    // 🛡️ MESH-SCAN: Sweep the ledger for active governance nodes
    // We use projection { _id: 1 } to extract only the IDs, saving RAM and bandwidth
    const activeProposals = await Proposal.find(
      { status: 'ACTIVE' },
      { _id: 1 }
    ).sort({ createdAt: -1 }); // Sort by newest first

    const proposalIds = activeProposals.map(prop => prop._id.toString());

    return NextResponse.json({ 
      success: true, 
      proposalIds 
    });

  } catch (error) {
    console.error("[MASTER_INDEX_PANIC]:", error);
    return NextResponse.json({ success: false, error: "MASTER_INDEX_PANIC" }, { status: 500 });
  }
}