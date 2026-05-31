import { NextResponse } from 'next/server';
import BurnEvent from '@/models/BurnEvent';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // 🛡️ Initialize the serverless Mongoose uplink

    // 🛡️ MESH-SCAN: Forge the Genesis Test Data
    const mockBurn = new BurnEvent({
      pioneerUid: "SIM-NODE-ALPHA",
      amount: 314.15, // Standard Pi Network Test Value
      txHash: "MESH-GENESIS-HASH-0001",
      timestamp: new Date()
    });

    // 🛡️ Execute the Database Write
    await mockBurn.save();

    return NextResponse.json({ 
      status: "INCINERATION_SUCCESS", 
      message: "Genesis BurnEvent locked into the Telemetry Vault.",
      data: mockBurn
    }, { status: 201 });

  } catch (error: any) {
    console.error("SIMULATION_FRACTURE:", error.message);
    return NextResponse.json({ 
      status: "FRACTURE", 
      message: "Failed to write to MongoDB Atlas." 
    }, { status: 500 });
  }
}
