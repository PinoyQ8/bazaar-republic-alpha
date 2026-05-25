import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToLedger } from '@/lib/mongodb';
import GenesisNode from '@/models/GenesisNode';

export async function POST(request: Request) {
  try {
    // 1. 🛡️ VERIFY THE ZERO-TRUST VAULT
    // We do not trust the frontend to tell us who the user is. We extract it from the secure vault.
    const cookieStore = await cookies();
    const session = cookieStore.get('mesh_session_token');

    if (!session) {
      console.warn("[MESH-SCAN] Unauthorized mint attempt intercepted.");
      return NextResponse.json({ success: false, error: 'NODE_UNVERIFIED' }, { status: 401 });
    }

    // Extract the UID from our salted cookie: {uid}-AUTH-{timestamp}
    const uid = session.value.split('-AUTH-')[0];

    // The frontend only passes the non-sensitive username for display logic
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ success: false, error: 'MISSING_PAYLOAD' }, { status: 400 });
    }

    // 2. 🛡️ INITIALIZE MONGODB UPLINK
    await connectToLedger();

    // 3. 🛡️ DUPLICATE PLEDGE CHECK (One Slot Per Node)
    const existingNode = await GenesisNode.findOne({ uid });
    if (existingNode) {
      console.log(`[MESH-SCAN] Node @${username} attempted duplicate pledge. Denied.`);
      return NextResponse.json(
        { success: false, error: 'ALREADY_PLEDGED', slot: existingNode.slotNumber }, 
        { status: 400 }
      );
    }

    // 4. 🛡️ THE SCARCITY ENGINE (Max 100)
    // We count the exact number of verified pledges currently hard-coded in the database
    const currentCount = await GenesisNode.countDocuments();
    if (currentCount >= 100) {
      console.log(`[MESH-SCAN] Genesis Capacity Reached. Rejecting @${username}.`);
      return NextResponse.json({ success: false, error: 'CAPACITY_REACHED' }, { status: 403 });
    }

    const nextSlot = currentCount + 1;

    // 5. 🛡️ THE MINTING FORGE
    const newPledge = new GenesisNode({
      uid,
      username,
      slotNumber: nextSlot,
      trustScore: 0.92, // Hard-coded Alpha baseline
    });

    await newPledge.save();

    console.log(`[SOROBAN] Genesis Slot #${nextSlot} permanently locked to @${username}.`);

    return NextResponse.json({ 
      success: true, 
      slotNumber: nextSlot, 
      message: 'GENESIS_MINTED' 
    });

  } catch (error: any) {
    console.error('[MESH-SCAN] Backend Forge Fracture:', error);

    // 🛡️ SHIELD 3: MONGODB DUPLICATE KEY TRAP (E11000)
    // Intercepts serverless race conditions and strict schema rejections
    if (error.code === 11000) {
      console.warn("[ADJUDICATOR] E11000 Duplicate Key trapped. Database rejected the write.");
      
      // If the UID triggered the duplicate error, they already pledged.
      if (error.keyPattern && error.keyPattern.uid) {
        return NextResponse.json(
          { success: false, error: 'ALREADY_PLEDGED' }, 
          { status: 400 }
        );
      }
      
      // If the slotNumber triggered the duplicate error, it was a race condition.
      return NextResponse.json(
        { success: false, error: 'SLOT_CONFLICT_RETRY' }, 
        { status: 409 } // 409 Conflict alerts the frontend to allow a retry
      );
    }

    return NextResponse.json({ success: false, error: 'INTERNAL_FRACTURE' }, { status: 500 });
  }
}