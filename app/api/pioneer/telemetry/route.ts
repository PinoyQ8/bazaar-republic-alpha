import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await req.json().catch(() => null);

    return NextResponse.json(
      {
        success: false,
        status: 'MIGRATING',
        message: 'Pioneer telemetry endpoint is currently undergoing storage alignment.',
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('[TELEMETRY_MIGRATION_ROUTE_ERROR]:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Failed to handle telemetry request.' },
      { status: 500 }
    );
  }
}