import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';

export async function GET(req: Request) {
  try {
    // 1. Extract the Pioneer ID from the request URL
    const { searchParams } = new URL(req.url);
    const pioneerId = searchParams.get('id');

    if (!pioneerId) {
      return NextResponse.json({ 
        status: 'MESH_FRACTURE', 
        error: 'Target Node ID not provided.' 
      }, { status: 400 });
    }

    // 2. Establish the MESH Uplink
    const db = await connectToLedger();

    // 3. Parallel Read Operation (Speed & Resilience)
    const [cdp, poolEntry] = await Promise.all([
      db.collection('pioneercdps').findOne({ pioneerId: pioneerId }),
      db.collection('stabilitypool').findOne({ liquidatorId: pioneerId })
    ]);

    // 4. Data Aggregation & Logic Routing
    // If the node exists, map the native ledger data. If not, default to 0 to prevent UI crashes.
    const activeFuel = cdp ? cdp.stakedPi : 0;
    const vestingShield = poolEntry ? poolEntry.lockedYield : 0;
    const healthFactor = cdp ? cdp.healthFactor : 0;
    
    // Total Equity is the sum of circulating fuel and locked yield
    const totalEquity = activeFuel + vestingShield;

    // 5. Fire the Payload to the HUD
    return NextResponse.json({
      status: 'MESH_SYNC_SUCCESS',
      data: {
        totalEquity,
        activeFuel,
        vestingShield,
        healthFactor
      }
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ 
      status: 'MESH_FRACTURE', 
      error: error.message 
    }, { status: 500 });
  }
}