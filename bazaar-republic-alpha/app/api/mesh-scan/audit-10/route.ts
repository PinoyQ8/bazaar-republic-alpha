import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb'; // 🛡️ Ensure this path is correct
import BurnEvent from '@/models/BurnEvent';

export async function GET() {
  try {
    // 🛡️ CRITICAL: You MUST await the connection before querying
    await connectToLedger(); 
    
    const interactions = await BurnEvent.find()
      .sort({ timestamp: -1 })
      .limit(10);
    
    return NextResponse.json({
      status: 'AUDIT_COMPLETE',
      count: interactions.length,
      data: interactions
    });
  } catch (error) {
    console.error("Ledger Connection Failed:", error);
    return NextResponse.json({ error: 'Database handshake failed' }, { status: 500 });
  }
}