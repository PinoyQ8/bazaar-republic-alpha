import { NextResponse } from "next/server";

export async function POST(request: Request) {
  console.log("[MESH-SCAN] API: INITIATING PAYMENT COMPLETION GATE");
  
  try {
    const body = await request.json();
    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      console.error("[MESH-SCAN] API Fault: Missing paymentId or txid payload.");
      return NextResponse.json({ error: "Missing Cryptographic Proof (paymentId or txid)" }, { status: 400 });
    }

    const apiKey = process.env.PI_API_KEY;
    
    // Final State Settlement with Pi Network servers
    const piEndpoint = `https://api.minepi.com/v2/payments/${paymentId}/complete`;
    
    const response = await fetch(piEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ txid: txid }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[MESH-SCAN] Pi Network Server Rejected Completion:", data);
      return NextResponse.json({ error: data.message || "Completion Failed" }, { status: response.status });
    }

    // TODO: MESH-SYNC - Inject Prisma / MongoDB state update here to lock the escrow status in our local database.
    
    console.log(`[MESH-SCAN] API: Contract Sealed. TXID ${txid} finalized on blockchain.`);
    return NextResponse.json(data);

  } catch (error) {
    console.error("[MESH-SCAN] API Fatal Error during Completion:", error);
    return NextResponse.json({ error: "Internal MESH Fault" }, { status: 500 });
  }
}