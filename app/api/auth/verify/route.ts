import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. 🛡️ INTERCEPT THE PAYLOAD
    const body = await request.json();
    const { accessToken } = body;

    if (!accessToken) {
      console.warn("[MESH-SCAN] Fracture: Missing Access Token.");
      return NextResponse.json(
        { success: false, error: "ACCESS_TOKEN_MISSING" }, 
        { status: 400 }
      );
    }

    // 2. 🛡️ THE PI NETWORK HANDSHAKE (Server-to-Server)
    // We ping the official Pi API. If the token is forged, Pi will reject it.
    const piResponse = await fetch('https://api.minepi.com/v2/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!piResponse.ok) {
      console.error(`[MESH-SCAN] Pi Network Adjudication Failed: ${piResponse.status}`);
      return NextResponse.json(
        { success: false, error: "PI_NETWORK_REJECTED" }, 
        { status: 401 }
      );
    }

    // 3. 🛡️ EXTRACT THE AUTHENTIC PIONEER DATA
    const piData = await piResponse.json();
    const pioneerUid = piData.uid;
    const pioneerUsername = piData.username;

    console.log(`[MESH-SCAN] Handshake Verified. Pioneer: ${pioneerUsername}`);

    // 4. 🛡️ THE VAULT LOCK (HttpOnly Cookie Forge)
    const response = NextResponse.json({
      success: true,
      message: "Node Verified by MESH",
      user: {
        uid: pioneerUid,
        username: pioneerUsername,
      }
    });

    // Hard-coding the session token into the server vault
    response.cookies.set({
      name: 'mesh_session_token',
      value: `${pioneerUid}-AUTH-${Date.now()}`, // Temporary Cryptographic Stand-in
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Requires HTTPS on Mainnet
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7-Day Vault Lock
    });

    return response;

  } catch (error) {
    console.error("[MESH-SCAN] Internal Logic Fracture:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_LOGIC_FAILURE" }, 
      { status: 500 }
    );
  }
}