import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb'; // Ensure this matches your file path

export async function POST() {
  try {
    // 1. Establish the MESH Uplink
    const db = await connectToLedger();
    const collection = db.collection('pioneercdps');

    // 2. The Native Test Payload
    // Without Mongoose, we enforce the 150% Uptime Shield directly in the payload logic
    const testCDP = {
      pioneerId: 'VANGUARD-NATIVE-001',
      stakedPi: 100,
      mintedMBZR: 50,
      healthFactor: 150, 
      lastUpdated: new Date()
    };

    // 3. Execute the Forge
    await collection.insertOne(testCDP);

    return NextResponse.json({ 
      status: 'MESH_SYNC_SUCCESS', 
      message: 'Native driver CDP successfully forged in the Republic Ledger.', 
      data: testCDP 
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ 
      status: 'MESH_SYNC_FAILED', 
      error: error.message 
    }, { status: 500 });
  }
}