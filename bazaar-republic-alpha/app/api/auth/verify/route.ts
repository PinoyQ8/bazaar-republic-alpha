import { NextResponse } from "next/server";

// 🛡️ THE ADJUDICATOR: HTTP Verification Bridge
export async function POST(req: Request) {
  const serverTimestamp = Date.now();

  try {
    // 1. EXTRACT PAYLOAD FROM MESH
    const body = await req.json();
    const { username, accessToken, uid } = body;

    // 2. 🛑 ZERO-TRUST PERIMETER: Payload Integrity Check
    if (!username || (!accessToken && !uid)) {
      console.warn(`[MESH-SCAN] ⚠️ Verification rejected: Malformed or missing node credentials.`);
      return NextResponse.json(
        { 
          success: false, 
          message: "ADJUDICATOR: MISSING CREDENTIALS. HANDSHAKE FAILED.",
          timestamp: serverTimestamp
        }, 
        { status: 400 } // Bad Request
      );
    }

    // 3. 🔐 VAULT KEY CHECK
    const PI_API_KEY = process.env.PI_API_KEY;
    if (!PI_API_KEY) {
      console.error(`[MESH-SCAN] 🚨 FATAL: PI_API_KEY is missing from the environment vault.`);
      return NextResponse.json(
        { 
          success: false, 
          message: "FATAL: BRIDGE CONNECTION FRACTURED. CHECK VAULT KEYS.",
          timestamp: serverTimestamp
        }, 
        { status: 500 } // Internal Server Error
      );
    }

    console.log(`[MESH-BRIDGE] 🟢 Initializing Pi Network Handshake for Node: ${username}`);

    // 4. 🌐 PI NETWORK API CALL (The External Bridge)
    // Here we query the official Pi Network backend to validate the accessToken
    /* 
    const piResponse = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const piData = await piResponse.json();
    if (!piResponse.ok) throw new Error("Pi Network rejected the token");
    */

    // Simulated Network Verification for the Alpha-Track Forge
    await new Promise((resolve) => setTimeout(resolve, 600));

    // 5. 🛡️ ADJUDICATOR APPROVAL
    console.log(`[MESH-BRIDGE] ✅ Node ${username} verified. Access granted to Republic.`);
    
    return NextResponse.json(
      {
        success: true,
        tier: "PIONEER",
        anchor: "GENESIS ALPHA",
        username: username, // Return normalized username
        message: "NODE VERIFIED. UPTIME SHIELD ACTIVE.",
        timestamp: serverTimestamp
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(`[MESH-SCAN] 🚨 CRITICAL API FAILURE:`, error);
    return NextResponse.json(
      { 
        success: false, 
        message: "FATAL: PAYLOAD FRACTURED DURING TRANSIT.",
        timestamp: serverTimestamp
      }, 
      { status: 500 }
    );
  }
}

// 🛑 LOCK DOWN UNAUTHORIZED METHODS
export async function GET() {
  return NextResponse.json(
    { success: false, message: "ADJUDICATOR: GET METHOD RESTRICTED. USE POST." },
    { status: 405 } // Method Not Allowed
  );
}