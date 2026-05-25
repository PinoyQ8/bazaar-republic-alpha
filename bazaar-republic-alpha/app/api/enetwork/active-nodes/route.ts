// 🛡️ MESH E-NETWORK: PUBLIC DIRECTORY RADAR
import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { ServiceProvider } from '@/lib/models/ServiceProvider';

// 🛡️ PRE-FLIGHT LOCK: Disable static caching to ensure real-time directory sync
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToLedger();

    // 🛡️ 1. MESH-SCAN: Isolate only ACTIVE nodes
    // 🛡️ 2. PRIVACY SHIELD: Select only public-facing parameters
    const activeNodes = await ServiceProvider.find({ status: 'ACTIVE' })
      .select('_id businessName serviceCategory registeredAt')
      .sort({ registeredAt: -1 }); // Render the newest verified nodes at the top

    return NextResponse.json({ 
      success: true, 
      nodes: activeNodes,
      count: activeNodes.length
    });

  } catch (error) {
    console.error("[PUBLIC_DIRECTORY_SCAN_PANIC]:", error);
    return NextResponse.json({ success: false, error: "INTERNAL_MESH_FRACTURE" }, { status: 500 });
  }
}