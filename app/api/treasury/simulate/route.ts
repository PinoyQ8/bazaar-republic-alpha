import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import BurnEvent from '@/models/BurnEvent';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { status: 'FRACTURE', message: 'Invalid or malformed JSON payload.' },
        { status: 400 }
      );
    }

    const pioneerUid =
      typeof body?.pioneerId === 'string' && body.pioneerId.trim()
        ? body.pioneerId.trim()
        : typeof body?.pioneerUid === 'string' && body.pioneerUid.trim()
          ? body.pioneerUid.trim()
          : 'UNKNOWN_NODE';

    const rawAmount = body?.amount ?? 314.15;
    const numericAmount = Number(rawAmount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { status: 'FRACTURE', message: 'Invalid burn amount.' },
        { status: 400 }
      );
    }

    const memo = typeof body?.memo === 'string' ? body.memo.trim() : undefined;

    await connectToLedger();

    const newInteraction = new BurnEvent({
      pioneerUid,
      amount: numericAmount,
      ...(memo ? { memo } : {}),
      txHash: `MESH-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      timestamp: new Date(),
    });

    await newInteraction.save();

    return NextResponse.json(
      {
        status: 'INCINERATION_SUCCESS',
        message: 'Interaction locked into the Telemetry Vault.',
        data: newInteraction,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('SIMULATION_FRACTURE:', error?.message || error);
    return NextResponse.json(
      {
        status: 'FRACTURE',
        message: 'Failed to write to MongoDB.',
      },
      { status: 500 }
    );
  }
}