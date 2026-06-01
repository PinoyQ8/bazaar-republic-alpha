import { NextRequest, NextResponse } from 'next/server';

// 🛡️ BAZAAR SECURITY ADJUDICATOR CONSTANTS
const ALLOWED_SECTORS = ['treasury', 'adjudicator', 'governance', 'vault'];

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const targetSector = req.headers.get('x-target-sector');

    // 1. IDENTITY VERIFICATION
    if (!authHeader || authHeader !== process.env.PI_API_KEY) {
      console.warn(`[SECURITY ALERT] Unauthorized access attempt to: ${targetSector}`);
      return NextResponse.json({ error: 'MESH-SCAN: Unauthorized' }, { status: 403 });
    }

    // 2. SECTOR VALIDATION
    if (!targetSector || !ALLOWED_SECTORS.includes(targetSector)) {
      return NextResponse.json({ error: 'MESH-SCAN: Invalid Sector' }, { status: 400 });
    }

    // 3. PAYLOAD PROCESSING
    const body = await req.json();

    // 🛡️ ROUTE TO DAO CORE (Logic Injection Point)
    // Here you would integrate your actual contract call (e.g., via Soroban SDK)
    console.log(`[MESH-SYNC] Authorized access to: ${targetSector}`);

    return NextResponse.json({ 
      status: 'MESH_SYNC_OK', 
      sector: targetSector,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[PROXY ERROR]', error);
    return NextResponse.json({ error: 'Sector Fracture Detected' }, { status: 500 });
  }
}

// 🛡️ ALLOW GET FOR MESH-HEALTH STATUS
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: 'MESH_ONLINE', version: 'v23.0.0' });
}