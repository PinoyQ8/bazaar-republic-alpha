import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import GenesisNode from '@/models/GenesisNode';

export async function POST(request: Request) {
  try {
    // 1. 🛡️ VERIFY THE ZERO-TRUST VAULT
    // Enforce Pi SDK Double-Check Architecture via Bearer Token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn("[MESH-SCAN] Missing or invalid Authorization header.");
      return NextResponse.json({ success: false, error: 'NODE_UNVERIFIED' }, { status: 401 });
    }
    const accessToken = authHeader.split(' ')[1];

    // Validate token against Pi Core Servers
    const piRes = await fetch('https://api.minepi.com/v2/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!piRes.ok) {
      console.warn("[MESH-SCAN] Pi Core validation failed.");
      return NextResponse.json({ success: false, error: 'NODE_UNVERIFIED' }, { status: 401 });
    }
    
    const piData = await piRes.json();
    const uid = piData.uid;

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