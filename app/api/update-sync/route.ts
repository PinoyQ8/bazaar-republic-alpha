import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const walletAddress =
      typeof body?.wallet_address === 'string' ? body.wallet_address.trim() : '';

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'NODE_IDENTITY_MISSING' },
        { status: 400 }
      );
    }

    const db = await connectToLedger();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'LEDGER_CONNECTION_UNAVAILABLE' },
        { status: 503 }
      );
    }

    const collection = db.collection('pioneer_registry');

    const pioneer = await collection.findOne({ wallet_address: walletAddress });
    if (!pioneer) {
      return NextResponse.json(
        { success: false, error: 'LEDGER_VOID' },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();
    const existingQuadrants =
      pioneer.quadrants && typeof pioneer.quadrants === 'object'
        ? pioneer.quadrants
        : {};

    const updatedQuadrants = {
      ...existingQuadrants,
      L_sync: {
        score: 1.0,
        last_updated: nowIso,
      },
    };

    const P = Number(updatedQuadrants.P_align?.score ?? 0.25);
    const S = Number(updatedQuadrants.S_stake?.score ?? 0.25);
    const C = Number(updatedQuadrants.C_eco?.score ?? 0.25);
    const L = Number(updatedQuadrants.L_sync?.score ?? 1.0);

    const calculated_ts = (P + S + C + L) / 4;
    const governance_eligible = calculated_ts >= 0.9;

    await collection.updateOne(
      { wallet_address: walletAddress },
      {
        $set: {
          quadrants: updatedQuadrants,
          calculated_ts,
          governance_eligible,
          last_sync: nowIso,
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        status: 'LEDGER_UPDATED',
        wallet_address: walletAddress,
        new_ts: calculated_ts,
        governance_eligible,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[MESH-SCAN] Backend Forge Failed:', error);
    return NextResponse.json(
      { success: false, error: 'VAULT_ACCESS_FAILED' },
      { status: 500 }
    );
  }
}