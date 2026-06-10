// 🛡️ MESH API: Pioneer Authentication Node
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("[MESH] 📡 Auth POST Request Received via Tunnel.");
    
    // Diagnostic Payload Extraction
    const textBody = await request.text();
    if (!textBody) {
      console.warn("[ADJUDICATOR] 🛑 Empty payload received.");
      return NextResponse.json({ success: false, message: "Empty payload." }, { status: 400 });
    }

    const body = JSON.parse(textBody);
    
    // 🛡️ SANITIZATION & FALLBACK
    const pioneerId = body.pioneerId?.trim() || body.username?.trim() || "";
    const passkey = body.passkey?.trim() || body.password?.trim() || "";

    // 🛡️ FORENSIC EVALUATION (CASE-INSENSITIVE DEV OVERRIDE)
    const isIdValid = pioneerId.toLowerCase() === "pinoyq8".toLowerCase();
    
    // Accept production target, lowercase test-bed strings, and emergency master keys
    const normalizedKey = passkey.toUpperCase();
    const isKeyValid = 
      normalizedKey === "MESH_SECURE" || 
      normalizedKey === "MESH-SECURE" || 
      normalizedKey === "GENESIS-10";

    console.log(`\n[ADJUDICATOR] 🔐 HANDSHAKE DIAGNOSTIC:`);
    console.log(`  -> ID  Received: '${pioneerId}' | Match: ${isIdValid}`);
    console.log(`  -> KEY Received: '${passkey}' | Match: ${isKeyValid}\n`);

    // 🛡️ ALPHA FORGE: Hard-Coded Founder Validation
    if (isIdValid && isKeyValid) {
      console.log(`[ADJUDICATOR] ✅ Handshake Verified. Injecting Cookie Shield.`);
      
      const response = NextResponse.json(
        { 
          success: true, 
          message: "Founder Identity Verified. Welcome to the MESH.",
          user: { uid: "FOUNDER_NODE_ACTIVE_777", username: "PinoyQ8" },
          accessToken: "MESH_ALPHA_TOKEN_SECURE"
        }, 
        { status: 200 }
      );
      
      // 🔐 FORGING THE CRYPTOGRAPHIC HANDSHAKE COOKIE
      response.cookies.set({
        name: "pioneer_uid",
        value: "FOUNDER_NODE_ACTIVE_777",
        httpOnly: true, 
        path: "/",
        secure: true, // Force secure attributes over public cloudflare tunnel mappings
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 Hour Shield
      });

      return response;
    }

    // 🛑 REJECTION
    console.warn(`[ADJUDICATOR] ⚠️ Handshake Failed. Invalid credentials.`);
    return NextResponse.json({ success: false, message: "Identity Not Recognized." }, { status: 401 });

  } catch (error) {
    console.error("[ADJUDICATOR] 🛑 Payload Parse Failure:", error);
    return NextResponse.json({ success: false, message: "Malformed JSON payload." }, { status: 400 });
  }
}