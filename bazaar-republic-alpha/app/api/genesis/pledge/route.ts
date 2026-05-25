import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToLedger } from '../../../../lib/mongodb'; // Using relative path to bypass alias fractures
import GenesisNode from '../../../../models/GenesisNode';

export async function POST(request: Request) {
  try {
    // 1. 🛡️ PARSE THE UPLINK PAYLOAD
    const body = await request.json();
    const { pioneerUid, pioneerUsername, assignedSlotNumber } = body;

    if (!pioneerUid || !pioneerUsername || !assignedSlotNumber) {
      return NextResponse.json({ success: false, error: 'INCOMPLETE_PAYLOAD' }, { status: 400 });
    }

    // 2. 🛡️ INITIATE LEDGER CONNECTION
    await connectToLedger();

    // 3. 🛡️ EXTRACT THE LINEAGE ANCHOR FROM THE VAULT
    const cookieStore = await cookies();
    const lineageCookie = cookieStore.get('mesh_invited_by');
    
    // If the cookie exists, inherit the UID. If not, fallback to Root.
    const lineageUid = lineageCookie ? lineageCookie.value : "GENESIS-ROOT";

    // 4. 🛡️ MINT THE NODE WITH INHERITANCE
    const newNode = await GenesisNode.create({
      uid: pioneerUid,
      username: pioneerUsername,
      slotNumber: assignedSlotNumber,
      invitedBy: lineageUid, // 🛡️ THE PERMANENT ANCHOR
      trustScore: 0.92,
      isFrozen: false
    });

    // 5. 🛡️ SYSTEM PURGE: SHRED THE COOKIE
    // Once lineage is secured in MongoDB, we destroy the temporary cryptographic anchor.
    cookieStore.delete('mesh_invited_by');

    console.log(`[VAULT] Genesis Slot #${assignedSlotNumber} minted for ${pioneerUid}. Lineage: ${lineageUid}`);
    return NextResponse.json({ success: true, node: newNode });

  } catch (error: any) {
    // Catch MongoDB duplicate key errors (e.g., node already exists)
    if (error.code === 11000) {
      console.warn(`[ADJUDICATOR] Duplicate Pledge Intercepted for ${error.keyValue?.uid}`);
      return NextResponse.json({ success: false, error: 'NODE_ALREADY_EXISTS' }, { status: 409 });
    }
    
    console.error('[MESH-SCAN] Genesis Pledge Fracture:', error);
    return NextResponse.json({ success: false, error: 'INTERNAL_FRACTURE' }, { status: 500 });
  }
}