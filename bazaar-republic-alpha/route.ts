import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Provider } from '@/lib/models/Provider';

export async function POST(request: Request) {
  try {
    // 1. Parse the accessToken from the incoming request body
    const body = await request.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'MISSING_TOKEN' }, { status: 400 });
    }

    // 2. Fetch from Pi Core using the accessToken as a Bearer token
    const piRes = await fetch('https://api.minepi.com/v2/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    // 3. If Pi Core validation fails, return a 401 Unauthorized response
    if (!piRes.ok) {
      console.warn("[MESH-SCAN] Pi Core validation failed during Auth Bridge.");
      return NextResponse.json({ success: false, error: 'NODE_UNVERIFIED' }, { status: 401 });
    }

    // 4. Extract verified identity payload
    const piData = await piRes.json();
    const { uid, username } = piData;

    // 5 & 6. Connect to MongoDB and prepare Provider model
    await connectToDatabase();

    // 7. Query the database for the unique Pi identity
    let provider = await Provider.findOne({ pi_uid: uid });

    // 8. If the Provider does NOT exist, securely construct a new node profile
    if (!provider) {
      provider = new Provider({
        pi_uid: uid,
        username: username,
        wallet_address: 'PENDING_ONBOARDING', // Will be collected later
        uptime_shield: 100,
        staked_collateral: 0,
        node_tier: 'Standard',
        is_active: true
      });
      await provider.save();
      console.log(`[MESH-BRIDGE] 🟢 New Node Registered via Auth Protocol: @${username}`);
    }

    // 9. Return verified Provider data
    return NextResponse.json({ success: true, provider }, { status: 200 });
  } catch (error: any) {
    console.error('[MESH-AUTH] Internal core fracture:', error);
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}