import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  await req.json().catch(() => null);
  return NextResponse.json(
    {
      success: false,
      status: 'MIGRATING',
      message: 'Sync engine is currently offline for storage alignment.',
    },
    { status: 503 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      status: 'MIGRATING',
      message: 'Sync engine is currently offline for storage alignment.',
    },
    { status: 503 }
  );
}