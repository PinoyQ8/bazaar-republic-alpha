import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import BurnEvent from '@/models/BurnEvent';

export async function GET() {
  try {
    await connectToLedger();

    // 🛡️ AGGREGATION LOGIC: Extract unique interactions for the Registry
    const registryDirectory = await BurnEvent.aggregate([
      {
        $group: {
          _id: "$pioneerUid",
          totalInteractions: { $sum: 1 },
          firstInteraction: { $min: "$timestamp" },
          lastInteraction: { $max: "$timestamp" },
          totalStaked: { $sum: "$amount" }
        }
      },
      { $sort: { totalInteractions: -1 } }
    ]);

    return NextResponse.json({
      status: "REGISTRY_SYNC_SUCCESS",
      count: registryDirectory.length,
      directory: registryDirectory
    });

  } catch (error) {
    return NextResponse.json({ status: "FRACTURE", message: "Registry sync failed." }, { status: 500 });
  }
}