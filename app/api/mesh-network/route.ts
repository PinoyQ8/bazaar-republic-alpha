import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Optional: Parse incoming payload if your network dashboard sends parameters
    const body = await request.json().catch(() => ({}));

    // Mock or fetch active MESH network telemetry nodes for Protocol 26.1
    const networkStatus = {
      status: "SUCCESS",
      protocol: "26.1.0",
      codename: "Yardstick",
      nodeEngine: "Soroban RPC Gateway",
      activePeers: 12,
      consensusHealth: "98.4%",
      latencyMs: 42,
      contractId: "CAMQTSG2LS3YV67K2VOT62U6ASZDVLSUM3TNLL2M6JJIOQIWCUHIR7OA",
      timestamp: new Date().toISOString(),
      nodes: [
        { id: "X570-TAICHI-NODE-01", role: "Validator / Primary", status: "ACTIVE", uptime: "92%" },
        { id: "S23-MOBILE-NODE-02", role: "Client / Viewport", status: "SYNCED", uptime: "99%" },
        { id: "PI-TESTNET-VAL-03", role: "Consensus Validator", status: "CONNECTED", uptime: "100%" }
      ]
    };

    return NextResponse.json(networkStatus, { status: 200 });
  } catch (error) {
    console.error("MESH API Error (/api/mesh-network):", error);
    return NextResponse.json(
      { status: "ERROR", message: "Failed to fetch MESH network telemetry." },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Fallback GET handler to prevent direct browser URL 404s
  return NextResponse.json({
    endpoint: "/api/mesh-network",
    status: "ONLINE",
    protocolVersion: "26.1.0"
  }, { status: 200 });
}