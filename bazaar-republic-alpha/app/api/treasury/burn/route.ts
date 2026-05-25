import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import BurnEvent from '@/models/BurnEvent';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 🛡️ MESH-GATE: Verify the Burn Command and Pioneer Identity
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ status: "REJECTED", message: "Invalid Mass" }, { status: 400 });
    }
    if (!body.pioneerUid) {
      return NextResponse.json({ status: "REJECTED", message: "Anonymous burns are strictly prohibited." }, { status: 400 });
    }

    await connectToLedger();
    
    // Write the destruction to the immutable ledger
    await BurnEvent.create({ 
      amount: body.amount, 
      pioneerUid: body.pioneerUid, // 🛡️ INJECTED: The missing schema anchor
      reason: body.reason || "GENESIS_TELEMETRY_TEST",
      timestamp: new Date()
    });

    return NextResponse.json({ 
      status: "SECURE", 
      message: `Successfully Incinerated ${body.amount} units.` 
    }, { status: 200 });

  } catch (error: any) {
    console.error("INCINERATOR_FRACTURE:", error.message);
    return NextResponse.json({ status: "FRACTURE", message: "Burn Sequence Failed." }, { status: 500 });
  }
}