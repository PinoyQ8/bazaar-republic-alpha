import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb'; // 🛡️ Ensure this connection is bridged
import BurnEvent from '@/models/BurnEvent';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 🛡️ Initialize MESH uplink
    await connectToLedger();

    // 🛡️ Parse dynamic payload
    const body = await req.json();
    const { pioneerId, amount, memo } = body;

    // 🛡️ MESH-SCAN: Forge Dynamic Interaction Data
    const newInteraction = new BurnEvent({
      pioneerUid: pioneerId || "UNKNOWN_NODE", // Dynamic ID
      amount: amount || 314.15,
      txHash: `MESH-${Math.random().toString(36).substring(2, 11).toUpperCase()}`, // Dynamic Hash
      timestamp: new Date()
    });

    // 🛡️ Execute the Database Write
    await newInteraction.save();

    return NextResponse.json({ 
      status: "INCINERATION_SUCCESS", 
      message: "Interaction locked into the Telemetry Vault.",
      data: newInteraction
    }, { status: 201 });

  } catch (error: any) {
    console.error("SIMULATION_FRACTURE:", error.message);
    return NextResponse.json({ 
      status: "FRACTURE", 
      message: "Failed to write to MongoDB Atlas." 
    }, { status: 500 });
  }
}