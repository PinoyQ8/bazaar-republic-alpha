import { NextResponse } from "next/server";
// 🛡️ Removed db import. Identity verification does not require a database ping.

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const accessToken = body.accessToken;

    // 🛡️ NEO PROTOCOL OVERRIDE: Local Dev Bypass (Sub-5ms Execution)
    if (process.env.NODE_ENV === "development") {
      console.log("[MESH-BRIDGE] Engaging Local Dev Bypass for PinoyQ8...");
      
      // Mimic the EXACT payload structure of the Pi Network v2/me API
      return NextResponse.json({
        uid: "PinoyQ8_Dev",
        username: "PinoyQ8_Dev"
      }, { status: 200 });
    }

    // --- STANDARD PRODUCTION PATH BELOW ---
    if (!accessToken) {
      return NextResponse.json({ error: "Missing Access Token" }, { status: 400 });
    }

    const piApiUrl = "https://api.minepi.com/v2/me";
    const response = await fetch(piApiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Pi API Error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("[AUTH-FAULT] Pi Verify Route Fault:", error);
    return NextResponse.json({ error: "SERVER-LOGIC-FAULT" }, { status: 500 });
  }
}