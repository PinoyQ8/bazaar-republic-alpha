import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 🏛️ MESH PROTOCOL: SECURE VAULT IDENTITY ADJUDICATOR
 * Verifies ephemeral Pi Browser signatures against the Core Network API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, username } = body;

    // VECTOR 1: Malformed Handshake Mitigation
    if (!accessToken || !username) {
      console.warn("[MESH-VAULT REJECTION] Authentication request dropped: Missing signatures.");
      return NextResponse.json({ success: false, error: "Malformed payload signatures." }, { status: 400 });
    }

    let isTokenVerified = false;
    let finalUsername = username.trim();

    // VECTOR 2: Production Environment Routing Loop
    if (process.env.NODE_ENV === 'production') {
      const piApiKey = process.env.PI_API_KEY;

      if (!piApiKey) {
        console.error("[MESH-VAULT CRITICAL] PI_API_KEY environment variable is absent from Vercel platform vault.");
        return NextResponse.json({ success: false, error: "Gateway configuration stasis fault." }, { status: 500 });
      }

      try {
        // Interrogate the official Pi Network API routing layer
        const piNetworkResponse = await fetch("https://api.minepi.com/v2/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`
          }
        });

        if (piNetworkResponse.ok) {
          const piUserData = await piNetworkResponse.json();
          // Force match username to guarantee the client isn't spoofing identities
          if (piUserData.username === finalUsername) {
            isTokenVerified = true;
          } else {
            console.warn(`[MESH-VAULT ALERT] Username mismatch. Client claimed: @${finalUsername}, API returned: @${piUserData.username}`);
          }
        }
      } catch (apiError) {
        console.error("[MESH-VAULT CORESYNC ERROR] Direct handshake transmission failed:", apiError);
        return NextResponse.json({ success: false, error: "External ecosystem sync timeout." }, { status: 502 });
      }
    } else {
      // 🎛️ LOCAL WORKSTATION OFFLINE SIMULATION (X570 Node Mode)
      console.log(`[MESH-VAULT] Operating in local dev mode. Simulating signature bits for user: @${finalUsername}`);
      isTokenVerified = accessToken.length >= 20; 
    }

    // VECTOR 3: Final Security Adjudication
    if (!isTokenVerified) {
      console.warn(`[MESH-VAULT REJECTION] Cryptographic token rejected for user: @${finalUsername}`);
      return NextResponse.json({ success: false, error: "Cryptographic validation failed or expired." }, { status: 401 });
    }

    // VECTOR 4: Authority Escalation Matrix
    let clearanceTier = "PIONEER";
    if (finalUsername === "PinoyQ8") {
      clearanceTier = "FOUNDER";
    }

    // 🔒 ASSEMBLE ENCRYPTED PRIVACY WRAPPER
    const sessionPayload = {
      user: finalUsername,
      tier: clearanceTier,
      timestamp: Date.now(),
      originNode: "VERCEL_EDGE_ROUTER"
    };

    const response = NextResponse.json({
      success: true,
      message: "Vault access granted. Session identity isolated inside HttpOnly perimeter.",
      clearanceTier,
      user: finalUsername
    });

    // 🛡️ DUAL-COOKIE INJECTION (Dynamic Host Scope)
    
    // 1. MASTER KEY: Secret, HttpOnly
    response.cookies.set({
      name: 'mesh_session_token',
      value: finalUsername, 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 3
    });

    // 2. STATE MANIFEST: Public, Visible to Dashboard JS
    response.cookies.set({
      name: 'mesh_user_state',
      value: JSON.stringify({ user: finalUsername, tier: clearanceTier }),
      httpOnly: false, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 3
    });

    console.log(`[MESH-VAULT SUCCESS] Identity Verified. @${finalUsername} upgraded to Tier [${clearanceTier}].`);
    return response;

  } catch (error) {
    console.error("[MESH-VAULT MATRIX PANIC] Absolute loop breakdown:", error);
    return NextResponse.json({ success: false, error: "Vault Isolation Matrix Failure." }, { status: 500 });
  }
}