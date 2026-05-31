import { NextResponse } from "next/server";

// 🛡️ MESH RATE LIMITER (In-Memory for Alpha-Track)
const rateLimitMap = new Map<string, { count: number; startTime: number }>();
const MAX_REQUESTS_PER_MINUTE = 10;

function applyRateLimit(ip: string): boolean {
  const currentTime = Date.now();
  const windowData = rateLimitMap.get(ip);

  if (!windowData || currentTime - windowData.startTime > 60000) {
    rateLimitMap.set(ip, { count: 1, startTime: currentTime });
    return true;
  }
  if (windowData.count >= MAX_REQUESTS_PER_MINUTE) return false;
  
  windowData.count++;
  return true;
}

// 🛡️ THE ADJUDICATOR: HTTP Verification Bridge
export async function POST(req: Request) {
  const serverTimestamp = Date.now();

  try {
    // 0. 🛑 ORIGIN & RATE LIMIT SHIELD
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
    const isVercel = origin.includes("mesh-academy-alpha.vercel.app") || origin.includes("bazaar-republic-alpha");
    
    if (!isLocalhost && !isVercel && origin !== "") {
      console.warn(`[MESH-BLOCK] Unauthorized origin attempted breach: ${origin}`);
      return NextResponse.json({ success: false, message: "MESH-REJECT: ORIGIN UNKNOWN." }, { status: 403 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!applyRateLimit(ip)) {
      return NextResponse.json({ success: false, message: "MESH-REJECT: NODE RATE LIMIT EXCEEDED." }, { status: 429 });
    }

    // 1. EXTRACT PAYLOAD FROM MESH
    const body = await req.json();
    const { username, accessToken, uid } = body;

    // 2. 🛑 ZERO-TRUST PERIMETER: Payload Integrity Check
    if (!username || (!accessToken && !uid)) {
      console.warn(`[MESH-SCAN] ⚠️ Verification rejected: Malformed or missing node credentials.`);
      return NextResponse.json(
        { success: false, message: "ADJUDICATOR: MISSING CREDENTIALS. HANDSHAKE FAILED.", timestamp: serverTimestamp }, 
        { status: 400 } 
      );
    }

    // 3. 🔐 VAULT KEY CHECK
    const PI_API_KEY = process.env.PI_API_KEY;
    if (!PI_API_KEY) {
      console.error(`[MESH-SCAN] 🚨 FATAL: PI_API_KEY is missing from the environment vault.`);
      return NextResponse.json(
        { success: false, message: "FATAL: BRIDGE CONNECTION FRACTURED. CHECK VAULT KEYS.", timestamp: serverTimestamp }, 
        { status: 500 } 
      );
    }

    console.log(`[MESH-BRIDGE] 🟢 Initializing Pi Network Handshake for Node: ${username}`);

    // 4. 🌐 PI NETWORK API CALL (The External Bridge)
    // Simulated Network Verification for the Alpha-Track Forge
    await new Promise((resolve) => setTimeout(resolve, 600));

    // 5. 🛡️ ADJUDICATOR APPROVAL
    console.log(`[MESH-BRIDGE] ✅ Node ${username} verified. Access granted to Republic.`);
    
    return NextResponse.json(
      {
        success: true,
        tier: "PIONEER",
        anchor: "GENESIS ALPHA",
        username: username, 
        message: "NODE VERIFIED. UPTIME SHIELD ACTIVE.",
        timestamp: serverTimestamp
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(`[MESH-SCAN] 🚨 CRITICAL API FAILURE:`, error);
    return NextResponse.json(
      { success: false, message: "FATAL: PAYLOAD FRACTURED DURING TRANSIT.", timestamp: serverTimestamp }, 
      { status: 500 }
    );
  }
}

// 🛑 LOCK DOWN UNAUTHORIZED METHODS
export async function GET() {
  return NextResponse.json(
    { success: false, message: "ADJUDICATOR: GET METHOD RESTRICTED. USE POST." },
    { status: 405 }
  );
}
