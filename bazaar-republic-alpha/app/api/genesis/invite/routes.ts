import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import GenesisNode from '@/models/GenesisNode';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    // 1. 🛡️ VERIFY THE ZERO-TRUST VAULT
    const cookieStore = await cookies();
    const session = cookieStore.get('mesh_session_token');

    if (!session) {
      console.warn("[MESH-SCAN] Unauthorized invite generation intercepted.");
      return NextResponse.json({ success: false, error: 'NODE_UNVERIFIED' }, { status: 401 });
    }

    const uid = session.value.split('-AUTH-')[0];

    // 2. 🛡️ CHECK STASIS LEDGER & GENESIS STATUS
    const pioneerNode = await GenesisNode.findOne({ uid });

    if (!pioneerNode) {
      return NextResponse.json({ success: false, error: 'NOT_GENESIS_NODE' }, { status: 403 });
    }

    if (pioneerNode.isFrozen) {
      console.warn(`[ADJUDICATOR] Frozen Node (${uid}) attempted to forge an invite.`);
      return NextResponse.json({ success: false, error: 'NODE_FROZEN' }, { status: 403 });
    }

    // 3. 🛡️ GENERATE THE CRYPTOGRAPHIC ANCHOR
    const expiration = Date.now() + 1000 * 60 * 60 * 24; // 24-hour decay timer
    const payload = `${uid}.${expiration}`;
    
    // The master lock for the HMAC signature
    const secret = process.env.MESH_SECRET || "alpha-fallback-secret-key";
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    
    // Base64 encode to make it URL-safe
    const secureToken = Buffer.from(`${payload}.${signature}`).toString('base64');

    // 4. 🛡️ CONSTRUCT THE UPLINK
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/academy/module-01?anchor=${secureToken}`;

    console.log(`[VAULT] Cryptographic invite forged by Genesis Node: ${uid}`);

    return NextResponse.json({ 
      success: true, 
      inviteLink, 
      expiresAt: expiration 
    });

  } catch (error) {
    console.error('[MESH-SCAN] Cryptographic Forge Fracture:', error);
    return NextResponse.json({ success: false, error: 'INTERNAL_FRACTURE' }, { status: 500 });
  }
}
