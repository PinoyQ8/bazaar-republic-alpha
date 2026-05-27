import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    // 1. Parse the incoming synthetic market data
    const body = await req.json();
    const { newHealthFactor } = body;

    if (!newHealthFactor) {
      return NextResponse.json({ 
        status: 'ORACLE_SYNC_FAILED', 
        error: 'Missing newHealthFactor in payload' 
      }, { status: 400 });
    }

    // 2. Establish the MESH Uplink
    const db = await connectToLedger();
    const collection = db.collection('pioneercdps');

    // 3. Execute the Flash Crash
    // We update every CDP in the ledger to simulate a global market drop
    const result = await collection.updateMany(
      {}, 
      { $set: { healthFactor: newHealthFactor, lastUpdated: new Date() } }
    );

    return NextResponse.json({ 
      status: 'ORACLE_SYNC_SUCCESS', 
      message: `Market adjusted. ${result.modifiedCount} Pioneer CDPs forcefully updated.`, 
      currentHealth: newHealthFactor 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ 
      status: 'ORACLE_SYNC_FAILED', 
      error: error.message 
    }, { status: 500 });
  }
}