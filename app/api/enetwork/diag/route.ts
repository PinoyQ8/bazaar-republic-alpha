export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { ServiceProvider } from '@/lib/models/ServiceProvider';
import dbConnect from '@/lib/dbConnect';

export const GET = async (request: Request) => {
  try {
    await dbConnect();
    const allNodes = await ServiceProvider.find({}).lean();
    return NextResponse.json({ allNodes });
  } catch (error) {
    console.error("Ledger Handshake Error:", error);
    return NextResponse.json({ error: "Failed to handshake with the Ledger" }, { status: 500 });
  }
};