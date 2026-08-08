// Location: app/api/ledger/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🛡️ MESH PATCH: Enforce dynamic rendering.
// This prevents the Vercel Bridge from caching the ledger as a static HTML page,
// ensuring the S23 Viewport always displays real-time cryptographic hashes.
export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    // Ping the Master Index for the latest 25 distributions
    const logs = await prisma.ledgerLog.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: 25,
    });

    return NextResponse.json({ 
      status: 'SUCCESS', 
      count: logs.length,
      data: logs 
    });
    
  } catch (error) {
    console.error("[MESH ERROR] Master Index Read Failed:", error);
    return NextResponse.json(
      { status: 'ERROR', message: "Ledger telemetry unavailable." }, 
      { status: 500 }
    );
  }
}