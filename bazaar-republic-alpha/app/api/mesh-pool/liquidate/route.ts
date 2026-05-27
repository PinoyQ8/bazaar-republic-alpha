import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';

export async function POST() {
  try {
    const db = await connectToLedger();
    const cdpCollection = db.collection('pioneercdps');
    const poolCollection = db.collection('stabilitypool');

    // 1. Scan for Critical CDPs (<= 110%)
    const vulnerableCDPs = await cdpCollection.find({ healthFactor: { $lte: 110 } }).toArray();

    if (vulnerableCDPs.length === 0) {
      return NextResponse.json({ 
        status: 'MESH_SHIELD_ACTIVE', 
        message: 'No vulnerable CDPs detected. 1mg Gold Peg secure.' 
      }, { status: 200 });
    }

    let liquidatedCount = 0;

    // 2. Execute the Dynamic Yield Math (5% to 25% Cubic Curve)
    // For this alpha stress-test, we simulate a 50% Pool Utilization
    const poolUtilization = 0.50; 
    const baseDiscount = 0.05;
    const maxDiscount = 0.25;
    
    // The Hard-Coded Cubic Curve Equation
    const currentDiscount = baseDiscount + ((maxDiscount - baseDiscount) * Math.pow(poolUtilization, 3));

    // 3. Process the Absorptions
    for (const cdp of vulnerableCDPs) {
      const liquidatedCollateral = cdp.stakedPi;
      const yieldBonus = liquidatedCollateral * currentDiscount;

      // Create the Tranche Buffer for the Liquidator (72-hour lock)
      const unlockTime = new Date();
      unlockTime.setHours(unlockTime.getHours() + 72);

      const poolEntry = {
        liquidatorId: 'SYSTEM_POOL_RESERVE',
        baseCapital: liquidatedCollateral,
        lockedYield: yieldBonus,
        unlockTimestamp: unlockTime,
        lastUpdated: new Date()
      };

      await poolCollection.insertOne(poolEntry);

      // Reset the Pioneer CDP (Debt cleared, Collateral seized)
      await cdpCollection.updateOne(
        { _id: cdp._id },
        { $set: { stakedPi: 0, mintedMBZR: 0, healthFactor: 0, lastUpdated: new Date() } }
      );

      liquidatedCount++;
    }

    return NextResponse.json({ 
      status: 'LIQUIDATION_EXECUTED', 
      message: `${liquidatedCount} Pioneer CDPs liquidated. Bad debt absorbed by the Stability Pool.`,
      appliedDiscount: `${(currentDiscount * 100).toFixed(2)}%`
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ 
      status: 'LIQUIDATION_FAILED', 
      error: error.message 
    }, { status: 500 });
  }
}