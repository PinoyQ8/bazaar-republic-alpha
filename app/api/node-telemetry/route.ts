import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevents Next.js from caching the live telemetry

export async function GET() {
  try {
    // 🛡️ MESH-SCAN: Pinging the local headless container
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