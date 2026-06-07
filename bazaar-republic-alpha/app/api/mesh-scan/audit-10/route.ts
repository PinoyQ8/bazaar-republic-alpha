// app/api/ledger/sync/route.ts (or equivalent route path)
import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import BurnEvent from '@/models/BurnEvent';

// 🛡️ CRITICAL MESH DIRECTIVE: Break the cache-lock.
// Ensures the E-Network always retrieves the real-time Master TS.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 🛡️ Handshake Protocol
    await connectToLedger();
    
    // Retrieve latest node interactions
    const interactions = await BurnEvent.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .lean(); // Strip Mongoose overhead to optimize memory buffer
    
    return NextResponse.json({
      status: 'SYNCED', // Aligned with MESH Telemetry
      count: interactions.length,
      data: interactions,
      timestamp: new Date().toISOString() // Attach localized Master TS
    }, { status: 200 });

  } catch (error) {
    console.error("[ADJUDICATOR] Ledger Connection Failed:", error);
    
    return NextResponse.json({ 
      status: 'LOGIC_BREACH',
      error: 'Database handshake failed to synchronize.' 
    }, { status: 500 });
  }
}