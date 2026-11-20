import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await req.json().catch(() => null);

    return NextResponse.json(
      {
        success: false,
        status: 'MIGRATING',
        message: 'Treasury-burn endpoint is currently offline for storage alignment.',
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('[TREASURY_BURN_ROUTE_ERROR]:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Routing failed during migration.' },
      { status: 500 }
    );
  }
}