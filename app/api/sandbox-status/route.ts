import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SANDBOX_STATUS_URL =
  process.env.SANDBOX_STATUS_URL || 'http://127.0.0.1:8000/RequestStatus?sandbox=true';

export async function GET() {
  try {
    const response = await fetch(SANDBOX_STATUS_URL, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Sandbox Upstream Error',
          status: response.status,
          details: data,
        },
        { status: response.status >= 400 && response.status < 600 ? response.status : 502 }
      );
    }

    return NextResponse.json(data ?? { status: 'OK' }, { status: 200 });
  } catch (error: any) {
    console.error('[SANDBOX_STATUS_ERROR]:', error?.message || error);
    return NextResponse.json(
      { error: 'Sandbox Offline', details: error?.message || 'Unreachable' },
      { status: 503 }
    );
  }
}