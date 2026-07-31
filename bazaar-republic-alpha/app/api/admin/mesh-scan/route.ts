import { NextResponse } from 'next/server';
import { db } from '../../../lib/db'; // 🛡️ Strict relative path to avoid compiler ghosts

export async function GET() {
  try {
    // 1. Fetch Node Fleet Data (sorting by updatedAt)
    const nodes = await db.pioneerNode.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    // 2. Fetch Recent Ledger Audit Feed (removed invalid orderBy to prevent TS faults)
    const ledger = await db.meshLedger.findMany({
      take: 20,
    });

    // 3. Aggregate Network Totals
    const totalNodes = await db.pioneerNode.count();
    
    const stats = await db.pioneerNode.aggregate({
      _sum: {
        stakedPi: true,
        mbzrBalance: true,
      },
    });

    // 4. Dispatch Telemetry
    return NextResponse.json({
      success: true,
      telemetry: {
        totalNodes,
        totalStakedPi: stats._sum.stakedPi || 0,
        totalMbzrBalance: stats._sum.mbzrBalance || 0,
        nodes,
        ledger,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[MESH-SCAN] Admin Telemetry Fault:', error);
    return NextResponse.json(
      { success: false, error: 'MESH_CRITICAL: Failed to retrieve mesh ledger audit.' },
      { status: 500 }
    );
  }
}