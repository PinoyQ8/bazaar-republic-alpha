import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface PiUserResponse {
  uid: string;
  username: string;
  roles?: string[];
}

export async function POST(req: Request) {
  // 1. Connection Protocol Verification
  const dbUrl = (process.env.MONGODB_URI || process.env.DATABASE_URL || '').trim();
  const prefix = dbUrl.substring(0, 15);

  if (!dbUrl.startsWith('mongodb://') && !dbUrl.startsWith('mongodb+srv://')) {
    console.error(`[DB_DIAGNOSTIC_FAULT] Invalid protocol prefix: "${prefix}"`);
    return NextResponse.json(
      {
        success: false,
        error: `INVALID_PROTOCOL_PREFIX: Expected mongo protocol, received "${prefix}"`,
      },
      { status: 500 }
    );
  }

  try {
    // 2. Extract Token from Body or Authorization Header
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.replace(/^Bearer\s+/i, '').trim();
    const accessToken =
      typeof body?.accessToken === 'string' && body.accessToken.trim()
        ? body.accessToken.trim()
        : bearerToken;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PI_ACCESS_TOKEN' },
        { status: 401 }
      );
    }

    // 3. Server-to-Server Pi Platform Verification
    let piUserData: PiUserResponse;
    try {
      const piPlatformRes = await fetch('https://api.minepi.com/v2/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });

      if (!piPlatformRes.ok) {
        const errorText = await piPlatformRes.text().catch(() => '');
        console.warn(
          `[PI_API_VALIDATION_WARNING] Status: ${piPlatformRes.status} - Payload: ${errorText}`
        );
        return NextResponse.json(
          {
            success: false,
            error: 'PI_TOKEN_VERIFICATION_FAILED',
            details: errorText,
          },
          { status: 401 }
        );
      }

      piUserData = (await piPlatformRes.json()) as PiUserResponse;
    } catch (fetchError: any) {
      console.error('[PI_PLATFORM_FETCH_ERROR]', fetchError?.message || fetchError);
      return NextResponse.json(
        { success: false, error: 'PI_PLATFORM_UNREACHABLE' },
        { status: 503 }
      );
    }

    const verifiedUid = piUserData?.uid?.trim();
    const verifiedUsername = piUserData?.username?.trim();

    if (!verifiedUid || !verifiedUsername) {
      return NextResponse.json(
        { success: false, error: 'INVALID_PI_USER_PAYLOAD' },
        { status: 502 }
      );
    }

    console.log(`[PI_TESTNET2_VERIFIED] UID: ${verifiedUid} | User: ${verifiedUsername}`);

    // 4. Atomic Pioneer Node Upsert in MongoDB
    const pioneerRecord = await prisma.pioneerNode.upsert({
      where: { uid: verifiedUid },
      update: {
        username: verifiedUsername,
        status: 'ACTIVE',
        lastActivityTimestamp: new Date(),
      },
      create: {
        uid: verifiedUid,
        username: verifiedUsername,
        tier: 'CITIZEN',
        status: 'ACTIVE',
        uptimeShield: 92,
        lastActivityTimestamp: new Date(),
      },
    });

    if ((pioneerRecord as any).isFrozen) {
      return NextResponse.json(
        { success: false, error: 'NODE_SANCTIONED_FROZEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: '[STATUS 200] Identity Forged',
        container: 'p27.1 testnet2',
        pioneer: pioneerRecord,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API_AUTH_VERIFY_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'DATABASE_WRITE_FAULT',
      },
      { status: 500 }
    );
  }
}