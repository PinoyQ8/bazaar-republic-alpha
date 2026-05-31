// 🛡️ MESH TELEMETRY: HARDWARE DOCKER BRIDGE (PROTECTED)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevents Next.js from caching the live telemetry

export async function GET(request: NextRequest) {
  try {
    // 🛡️ 1. THE FOUNDER'S CRYPTOGRAPHIC LOCK
    // This prevents random web traffic from triggering the Docker fetch.
    const hardwareKey = request.headers.get('x-mesh-hardware-key');
    const expectedKey = process.env.PI_API_KEY || 'ALPHA-TEST-KEY'; // Fallback for local dev

    if (hardwareKey !== expectedKey) {
      console.warn("[SECURITY BREACH] Unauthorized ping on hardware telemetry port.");
      return NextResponse.json({ 
        status: "LOCKED", 
        message: "Hardware port access denied by Adjudicator." 
      }, { status: 403 });
    }

    // 🛡️ 2. THE VERCEL CLOUD SHIELD
    // If deployed to Vercel, 127.0.0.1 does not point to your X570. We must intercept.
    if (process.env.NODE_ENV === 'production' && !process.env.IS_LOCAL_SERVER) {
      console.log("[MESH-SCAN] Cloud Environment Detected. Simulating Docker Bridge.");
      return NextResponse.json({ 
        status: "CLOUD-STASIS", 
        message: "Docker Bridge is strictly bound to the X570 Local Node.",
        telemetry: {
          state: "Vercel-Hosted",
          protocol: "v23 (Cloud)",
          ledger: "N/A",
          uptime_pulse: "N/A",
          peers: { inbound: 0, outbound: 0, total: 0 }
        }
      }, { status: 200 });
    }

    // 🛡️ 3. THE X570 DOCKER PING (Execution strictly for local workstation)
    const res = await fetch('http://127.0.0.1:11626/info', { 
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) throw new Error("Diagnostic port unreachable");
    
    const data = await res.json();
    
    // 🛡️ PARSING THE DNA: Translating Stellar-Core JSON to MESH format
    const telemetry = {
      state: data.info.state || "Unknown",
      protocol: data.info.protocol_version || "v??",
      ledger: data.info.ledger?.num || 0,
      uptime_pulse: data.info.ledger?.age || 0,
      peers: {
        inbound: data.info.peers?.inbound_count || 0,
        outbound: data.info.peers?.outbound_count || 0,
        total: (data.info.peers?.inbound_count || 0) + (data.info.peers?.outbound_count || 0)
      }
    };
    
    return NextResponse.json({ status: "LIVE", telemetry }, { status: 200 });

  } catch (error: any) {
    console.error("TELEMETRY_FRACTURE:", error.message);
    return NextResponse.json({ 
      status: "STASIS", 
      message: "Node Telemetry Offline. Awaiting Docker Bridge." 
    }, { status: 503 });
  }
}
