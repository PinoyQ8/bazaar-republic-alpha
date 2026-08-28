import { NextResponse } from "next/server";

export async function POST(request: Request) {
  console.log("[MESH-SCAN] API: INITIATING PAYMENT APPROVAL GATE");
  
  try {
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      console.error("[MESH-SCAN] API Fault: Missing paymentId payload.");
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
    }

    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      console.error("[MESH-SCAN] CRITICAL: PI_API_KEY missing from environment vault.");
      return NextResponse.json({ error: "Server Configuration Fault" }, { status: 500 });
    }

    // Execute cryptographic handshake with Pi Network servers
    const piEndpoint = `https://api.minepi.com/v2/payments/${paymentId}/approve`;
    
    const response = await fetch(piEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[MESH-SCAN] Pi Network Server Rejected Approval:", data);
      return NextResponse.json({ error: data.message || "Approval Failed" }, { status: response.status });
    }

    console.log(`[MESH-SCAN] API: Payment ${paymentId} Approved Successfully.`);
    return NextResponse.json(data);

  } catch (error) {
    console.error("[MESH-SCAN] API Fatal Error during Approval:", error);
    return NextResponse.json({ error: "Internal MESH Fault" }, { status: 500 });
  }
}