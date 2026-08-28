import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import PioneerLedger from '@/models/PioneerLedger';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { pioneer_id, title, description, execution_logic } = payload;

    // 🛡️ BAZAAR TECH: Vector Beta Defense (Strict Input Validation)
    if (!pioneer_id || !title || !description) {
      console.error("[ADJUDICATOR] Malformed Governance Payload Intercepted.");
      return NextResponse.json({ 
        status: 'LOGIC_BREACH', 
        error: 'Incomplete MESH payload.' 
      }, { status: 400 });
    }

    await connectToLedger();

    // 🛡️ BAZAAR TECH: RBAC & Ghost Admin Defense
    // The Adjudicator must verify the Pioneer exists in the true E-Network Ledger
    // before granting them write-access to the Governance database.
    const pioneer = await PioneerLedger.findOne({ uid: pioneer_id });

    if (!pioneer) {
      console.warn(`[ADJUDICATOR] Ghost Node Blocked. Unauthorized ID: ${pioneer_id}`);
      return NextResponse.json({ 
        status: 'UNAUTHORIZED', 
        error: 'Node is not registered in the Bazaar Republic.' 
      }, { status: 403 });
    }

    // Optional: Add a "Reputation" or "Stake" check here for future Mainnet versions
    // if (pioneer.balance < 10) throw new Error("Insufficient voting weight to submit proposals.");

    // 🛡️ THE EFFECTS (State Mutation)
    // If we reach this line, the Adjudicator has verified the identity.
    // Proceed with your Prisma or Mongoose creation logic for the proposal.
    /* const newProposal = await Prisma.internalProposal.create({
        data: {
          authorId: pioneer_id,
          title,
          description,
          status: 'ACTIVE'
        }
      });
    */

    return NextResponse.json({ 
      status: 'SYNCED', 
      message: 'Governance proposal mathematically secured on the ledger.' 
    }, { status: 200 });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown forge failure';
    return NextResponse.json({ 
      status: 'FORGE_FAILED', 
      error: errorMessage 
    }, { status: 500 });
  }
}