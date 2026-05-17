// 🛡️ BAZAAR REPUBLIC: 100% PCT COMPLIANCE AUTHENTICATION GATEWAY
import { NextResponse } from 'next/server';
import { signMeshToken } from '@/lib/auth-mesh';
import { prisma } from '@/lib/mesh-prisma'; // Centralized Neon HTTP Engine Client

export async function POST(request: Request) {
  try {
    const { accessToken, pioneerUid } = await request.json();

    // 🚨 RULE 1: Validate payload parameters before executing network threads
    if (!accessToken || !pioneerUid) {
      return NextResponse.json(
        { error: "PCT Handshake Failure: Incomplete token or identity payload." },
        { status: 400 }
      );
    }

    // 🏛️ RULE 2: Server-to-Server Authentication Loop with Pi Core Team API
    // This eliminates client-side spoofing vectors entirely.
    const piNetworkResponse = await fetch('https://api.minepi.com/v2/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!piNetworkResponse.ok) {
      console.error(`[MESH-SCAN] Cryptographic rejection from api.minepi.com. Status: ${piNetworkResponse.status}`);
      return NextResponse.json(
        { error: "PCT Security Exception: Remote blockchain handshake rejected." },
        { status: 401 }
      );
    }

    // Parse the authenticated profile payload directly from the Core Team's secure response
    const piProfile = await piNetworkResponse.json();

    // 🚨 RULE 3: Cross-Check Identity Immutability
    // Ensure the UID claimed by the frontend matches the cryptographic token owner verified by the PCT.
    if (piProfile.uid !== pioneerUid) {
      console.error(`[MESH-SCAN] CRITICAL: Identity mismatch detected! Claimed: ${pioneerUid}, Verified: ${piProfile.uid}`);
      return NextResponse.json(
        { error: "PCT Security Exception: Identity parameter structural mutation detected." },
        { status: 403 }
      );
    }

    // ====================================================================
    // 📥 AUTOMATED ACCUMULATION LAYER: INITIAL USER SEED
    // ====================================================================
    // Safely upsert the baseline profile within our PostgreSQL ledger instance.
    // If they exist, we sync their username; if not, we initialize their node parameters.
    const userNode = await prisma.userWallet.upsert({
      where: { pioneerUid: piProfile.uid },
      update: {
        // Keep their profile synced with any username adjustments made on the primary network
        username: piProfile.username || "Anonymous Pioneer"
      },
      create: {
        pioneerUid: piProfile.uid,
        username: piProfile.username || "Anonymous Pioneer",
        mbzrBalance: 0.0 // Initializing simulation balance tracking cleanly
      }
    });

    // Determine authorization role tier weights
    const assignedRole = piProfile.roles?.includes('moderator') ? 'MODERATOR' : 'CITIZEN';

    // ====================================================================
    // 🔐 CRYPTOGRAPHIC TOKEN GENERATION
    // ====================================================================
    // Seal the verified parameters inside our native Web-Crypto JWT infrastructure
    const meshToken = await signMeshToken({
      pioneerUid: userNode.pioneerUid,
      role: assignedRole
    });

    console.log(`[SUCCESS] Handshake verified for Pioneer: ${userNode.username} [${assignedRole}]`);

    // Return the token to the client node. The Pi Browser app frontend will intercept this 
    // and inject it into all subsequent Axios/Fetch authorization headers.
    return NextResponse.json({
      success: true,
      meshToken,
      pioneer: {
        uid: userNode.pioneerUid,
        username: userNode.username,
        role: assignedRole
      }
    });

  } catch (error) {
    console.error("[FATAL] Auth Verification Sector Fracture:", error);
    return NextResponse.json(
      { error: "Internal Security Adjudicator Exception." },
      { status: 500 }
    );
  }
}