import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db'; // 🛡️ Relative import to avoid compiler ghosts

// 🛡️ 1. FETCH ALL E-NETWORK PROVIDERS (GET)
export async function GET() {
  try {
    const providers = await (db as any).serviceProvider.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      telemetry: {
        totalProviders: providers.length,
        providers,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('[ENET-PROVIDERS] Fetch Exception:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER-LOGIC-FAULT: Failed to pull E-Network service providers.' },
      { status: 500 }
    );
  }
}

// 🛡️ 2. REGISTER NEW E-NETWORK PROVIDER (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessName, category, description, providerUid, sectorLocation, mbzrRate, unitLabel } = body;

    // Payload Shield
    if (!businessName || !category || !providerUid || mbzrRate === undefined) {
      return NextResponse.json(
        { success: false, error: 'MALFORMED_PAYLOAD: Missing required businessName, category, providerUid, or mbzrRate.' },
        { status: 400 }
      );
    }

    // Verify Provider Node (Type Shielded)
    const providerNode = await (db as any).pioneerNode.findUnique({
      where: { uid: providerUid },
    });

    if (!providerNode || providerNode.status === ('FROZEN' as any)) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED_NODE: Provider node is non-existent or frozen.' },
        { status: 403 }
      );
    }

    const isVerified = providerNode.tier === ('BAZAAR_FOUNDER' as any) || providerNode.tier === ('MESH_GUARDIAN' as any);

    const newProvider = await (db as any).serviceProvider.create({
      data: {
        businessName,
        category: category as any,
        description: description || '',
        providerUid,
        sectorLocation: sectorLocation || 'Sector 1',
        mbzrRate: Number(mbzrRate),
        unitLabel: unitLabel || 'per service',
        isVerified,
        totalSettlements: 0,
        rating: 5.0,
      },
    });

    console.log(`[ENET-PROVIDERS] New Service Provider Node Registered: ${newProvider.id} by ${providerUid}`);

    return NextResponse.json({
      success: true,
      telemetry: {
        provider: newProvider,
        timestamp: Date.now(),
      },
    }, { status: 201 });

  } catch (error) {
    console.error('[ENET-PROVIDERS] Registration Exception:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER-LOGIC-FAULT: Failed to register service provider node.' },
      { status: 500 }
    );
  }
}