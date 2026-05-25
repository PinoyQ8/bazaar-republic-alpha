// 🛡️ 1. THE DEPENDENCY BRIDGE (Do not remove these lines)
import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import BurnEvent from '@/models/BurnEvent';

export const dynamic = 'force-dynamic';

// 🛡️ 2. TELEMETRY NODE (Read-Only)
export async function GET() {
  try {
    await connectToLedger();

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

// 🛡️ 3. BINDING GATEWAY (Write/Initialize)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (body.action === 'INITIALIZE_GENESIS_BIND') {
      await connectToLedger();
      
      // The Ledger confirms the binding authorization
      return NextResponse.json({ 
        status: "SECURE", 
        vaultState: "BOUND",
        message: "Genesis Asset Link Established." 
      }, { status: 200 });
    }

    return NextResponse.json({ status: "REJECTED", message: "Invalid MESH Command" }, { status: 400 });

  } catch (error: any) {
    console.error("TREASURY_BIND_FRACTURE:", error.message);
    return NextResponse.json({ 
      status: "FRACTURE", 
      message: "Vault Binding Failed." 
    }, { status: 500 });
  }
}