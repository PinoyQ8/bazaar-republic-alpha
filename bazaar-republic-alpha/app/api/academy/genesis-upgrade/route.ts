import { NextResponse } from 'next/server';
import { db } from '../../../lib/db'; // 🛡️ Ensure this points to your Prisma singleton

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid } = body;

    // 1. Payload Shield
    if (!uid) {
      return NextResponse.json(
        { error: 'MESH_ERROR: Pioneer UID is required for protocol upgrade.' },
        { status: 400 }
      );
    }

    // 2. Verify Node Existence in MESH Ledger
    const pioneerNode = await db.pioneerNode.findUnique({
      where: { uid: uid },
    });

    if (!pioneerNode) {
      return NextResponse.json(
        { error: 'MESH_ERROR: Node identity not found in the ledger.' },
        { status: 404 }
      );
    }

    // 3. Prevent Redundant Processing
    if (pioneerNode.status === 'ACTIVE') {
      return NextResponse.json(
        { 
          message: 'Node is already ACTIVE.', 
          status: pioneerNode.status, 
          tier: pioneerNode.tier 
        },
        { status: 200 }
      );
    }

    // 4. Execute Ledger Upgrade Transaction
    const updatedNode = await db.pioneerNode.update({
      where: { uid: uid },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    // 5. Immutable Audit Trail (Academy Module Completion)
    await db.academyLog.create({
      data: {
        pioneerUid: uid,
        action: 'GENESIS_COMPLETED',
        moduleLocked: 'MODULE_01_GENESIS',
      },
    });

    // 6. Return synchronized state to the client
    return NextResponse.json({
      message: 'Genesis protocol complete. Node is now ACTIVE.',
      status: updatedNode.status,
      tier: updatedNode.tier,
    }, { status: 200 });

  } catch (error) {
    console.error('[MESH-SCAN] API Route Exception (Genesis Upgrade):', error);
    return NextResponse.json(
      { error: 'MESH_CRITICAL: Internal server fault during ledger upgrade.' },
      { status: 500 }
    );
  }
}