// 🛡️ MESH CORE: INDIVIDUAL PROVIDER TELEMETRY
import { NextResponse } from 'next/server';
import { ServiceProvider } from '@/lib/models/ServiceProvider';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 🛡️ MESH PASSTHROUGH: Reading the hard-coded UID for testing.
    // In Vector Omega, this will be strictly extracted from the Pi Auth token.
    const pioneerUid = request.headers.get('x-mesh-pioneer-uid') || 'GENESIS-ANCHOR';

    if (!pioneerUid) {
      return NextResponse.json({ success: false, error: "MISSING_PIONEER_UID" }, { status: 401 });
    }


    const provider = await ServiceProvider.findOne({ pioneerUid: pioneerUid });

    if (!provider) {
      return NextResponse.json({ success: false, error: "NO_NODE_REGISTERED" }, { status: 404 });
    }

    return NextResponse.json({ success: true, provider });

  } catch (error) {
    console.error("[PROVIDER_DASHBOARD_PANIC]:", error);
    return NextResponse.json({ success: false, error: "INTERNAL_MESH_FRACTURE" }, { status: 500 });
  }
}
