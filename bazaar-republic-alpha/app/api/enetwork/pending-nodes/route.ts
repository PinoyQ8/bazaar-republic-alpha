// 🛡️ MESH E-NETWORK: PENDING NODES RADAR
import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { ServiceProvider } from '@/lib/models/ServiceProvider';

// 🛡️ PRE-FLIGHT LOCK: Disable static caching to ensure real-time telemetry
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 🛡️ 1. TERMINAL CLEARANCE CHECK
    const role = request.headers.get('x-mesh-pioneer-role');
    
    if (role !== 'FOUNDER' && role !== 'ELDER') {
      return NextResponse.json({ success: false, error: "INSUFFICIENT_CLEARANCE_LEVEL" }, { status: 403 });
    }

    await connectToLedger();

    // 🛡️ 2. MESH-SCAN: Isolate nodes in stasis
    // Sort by oldest first (1) to ensure the backlog is processed fairly.
    // LINTER ALIGNED: Scanning for 'PENDING' to match the Mongoose schema default.
    const pendingNodes = await ServiceProvider.find({ status: 'PENDING' })
      .select('_id pioneerUid businessName serviceCategory complianceHash registeredAt')
      .sort({ registeredAt: 1 }); 

    return NextResponse.json({ 
      success: true, 
      nodes: pendingNodes 
    });

  } catch (error) {
    console.error("[PENDING_NODES_SCAN_PANIC]:", error);
    return NextResponse.json({ success: false, error: "INTERNAL_MESH_FRACTURE" }, { status: 500 });
  }
}