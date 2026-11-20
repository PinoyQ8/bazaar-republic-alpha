// Location: app/api/settlement/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { PioneerNode } from '@/models/PioneerNode';

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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'INVALID_JSON_PAYLOAD' },
        { status: 400 }
      );
    }

    const rawCartValue = body?.cartValue ?? 500;
    const cartValue = Number(rawCartValue);
    const buyerUid =
      typeof body?.buyerUid === 'string' && body.buyerUid.trim()
        ? body.buyerUid.trim()
        : '';
    const merchantUid =
      typeof body?.merchantUid === 'string' && body.merchantUid.trim()
        ? body.merchantUid.trim()
        : 'SYSTEM_DAO_COLLECTOR';

    if (!buyerUid) {
      return NextResponse.json(
        { success: false, error: 'MISSING_BUYER_UID' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(cartValue) || cartValue <= 0) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CART_VALUE' },
        { status: 400 }
      );
    }

    await ensureMongoConnected();

    const buyer: any = await PioneerNode.findOne({ uid: buyerUid }).lean();
    if (!buyer) {
      return NextResponse.json(
        { success: false, error: 'BUYER_NODE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const currentFuel = Number(buyer?.activeFuel ?? 0);
    if (currentFuel < cartValue) {
      return NextResponse.json(
        { success: false, error: 'INSUFFICIENT_ACTIVE_FUEL' },
        { status: 409 }
      );
    }

    await PioneerNode.updateOne(
      { uid: buyerUid },
      { $inc: { activeFuel: -cartValue } }
    );

    await PioneerNode.updateOne(
      { uid: merchantUid },
      {
        $inc: { activeFuel: cartValue },
        $setOnInsert: {
          uid: merchantUid,
          activeNodeCount: 1,
          uptimeStats: 100,
          referralCount: 0,
          trustScore: 50,
        },
      },
      { upsert: true }
    );

    const accounts = await PioneerNode.find({
      uid: { $in: [buyerUid, merchantUid] },
    }).lean();

    return NextResponse.json(
      {
        success: true,
        message: 'Settlement Cleared & Treasury Balanced',
        data: accounts,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('API_SETTLEMENT_FRACTURE:', error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: 'MESH_FRACTURE_DETECTED',
        message: error?.message || 'Settlement failed',
      },
      { status: 500 }
    );
  }
}