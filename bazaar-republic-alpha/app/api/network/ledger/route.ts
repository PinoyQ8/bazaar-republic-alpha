import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET() {
  try {
    // 🛡️ MESH PATCH: Query raw ledger entries safely without relation constraints
    let ledgerEntries: any[] = [];

    if ((db as any).meshLedger) {
      ledgerEntries = await (db as any).meshLedger.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } else if ((db as any).ledger) {
      ledgerEntries = await (db as any).ledger.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({
      success: true,
      telemetry: {
        ledger: ledgerEntries,
        timestamp: Date.now(),
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('[LEDGER-API-FAULT]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to pull Mesh Ledger telemetry.' },
      { status: 500 }
    );
  }
}