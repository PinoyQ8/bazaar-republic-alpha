import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const accessToken =
      typeof body?.accessToken === 'string' ? body.accessToken.trim() : '';

    if (!accessToken) {
      return NextResponse.json(
        { error: 'HANDSHAKE_FAILED: Missing Pioneer Access Token' },
        { status: 400 }
      );
    }

    let verifyResponse: Response;
    try {
      verifyResponse = await fetch('https://api.minepi.com/v2/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(8000),
      });
    } catch (netError) {
      console.error('[MESH-SCAN] Pi Platform unreachable:', netError);
      return NextResponse.json(
        { error: 'UPSTREAM_TIMEOUT: Failed to reach Pi Platform API' },
        { status: 502 }
      );
    }

    if (!verifyResponse.ok) {
      return NextResponse.json(
        { error: 'HANDSHAKE_FAILED: Invalid Pioneer Token' },
        { status: 401 }
      );
    }

    const pioneerData = await verifyResponse.json().catch(() => null);
    const verifiedUid =
      typeof pioneerData?.uid === 'string' ? pioneerData.uid.trim() : '';

    if (!verifiedUid) {
      return NextResponse.json(
        { error: 'HANDSHAKE_FAILED: Missing verified UID from Pi Platform' },
        { status: 502 }
      );
    }

    console.log(`[MESH-SCAN]: Verified Reclaim Request for: ${verifiedUid}`);

    return NextResponse.json(
      {
        success: true,
        uid: verifiedUid,
        message: 'IDENTITY_VERIFIED: Reclaim sequence initiated.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[MESH-SCAN] API Fracture:', error);
    return NextResponse.json(
      { error: 'SYSTEM_FRACTURE: Internal Logic Error' },
      { status: 500 }
    );
  }
}