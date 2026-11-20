import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import BurnEvent from '@/models/BurnEvent';

export const dynamic = 'force-dynamic';

async function ensureMongoConnected() {
  if (mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error('Missing MONGODB_URI or DATABASE_URL environment variable.');
  }
  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  });
}

// 1. TELEMETRY NODE (Read-Only)
export async function GET() {
  try {
    await ensureMongoConnected();

    const result = await BurnEvent.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalBurned = result.length > 0 ? Number(result[0]?.total ?? 0) : 0;

    return NextResponse.json(
      {
        status: 'SECURE',
        totalBurned,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('TREASURY_FRACTURE:', error?.message || error);
    return NextResponse.json(
      {
        status: 'FRACTURE',
        message: 'Telemetry Vault Offline.',
      },
      { status: 503 }
    );
  }
}

// 2. BINDING GATEWAY (Write/Initialize)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { status: 'REJECTED', message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    if (body.action === 'INITIALIZE_GENESIS_BIND') {
      return NextResponse.json(
        {
          status: 'SECURE',
          vaultState: 'BOUND',
          message: 'Genesis Asset Link Established.',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: 'REJECTED', message: 'Invalid MESH Command' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('TREASURY_BIND_FRACTURE:', error?.message || error);
    return NextResponse.json(
      {
        status: 'FRACTURE',
        message: 'Vault Binding Failed.',
      },
      { status: 500 }
    );
  }
}