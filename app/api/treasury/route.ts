import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import BurnEvent from '@/models/BurnEvent';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 🛡️ Initialize the serverless cached connection
    await connectToLedger();

    // 🛡️ MESH-SCAN: Aggregating the total incinerated mass natively via Mongoose
    const result = await BurnEvent.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalBurned = result.length > 0 ? result[0].total : 0;

    return NextResponse.json({ 
      status: "SECURE", 
      totalBurned 
    }, { status: 200 });

  } catch (error: any) {
    console.error("TREASURY_FRACTURE:", error.message);
    return NextResponse.json({ 
      status: "FRACTURE", 
      message: "Telemetry Vault Offline." 
    }, { status: 503 });
  }
}