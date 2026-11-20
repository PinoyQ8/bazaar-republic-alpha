import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await req.json().catch(() => null);

    return NextResponse.json(
      {
        success: false,
        status: 'MIGRATING',
        message: 'Pledge engine is currently offline for database alignment.',
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('[PLEDGE_ROUTE_ERROR]:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Failed to handle pledge request.' },
      { status: 500 }
    );
  }
}