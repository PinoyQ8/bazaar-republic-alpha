import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface PiUserResponse {
  uid?: string;
  username?: string;
  roles?: string[];
}

export async function POST(req: Request) {
  const dbUrl = (process.env.MONGODB_URI || process.env.DATABASE_URL || '').trim();
  const prefix = dbUrl.slice(0, 15);

  if (!dbUrl.startsWith('mongodb://') && !dbUrl.startsWith('mongodb+srv://')) {
    console.error(`[DB_DIAGNOSTIC_FAULT] Invalid protocol prefix: "${prefix}"`);
    return NextResponse.json(
      { success: false, error: 'INVALID_DATABASE_PROTOCOL' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.replace(/^Bearer\s+/i, '').trim();
    const accessToken =
      typeof body?.accessToken === 'string' && body.accessToken.trim()
        ? body.accessToken.trim()
        : bearerToken || '';

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PI_ACCESS_TOKEN' },
        { status: 401 }
      );
    }

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
          { success: false, error: 'PI_TOKEN_VERIFICATION_FAILED' },
          { status: 401 }
        );
      }

      piUserData = (await piPlatformRes.json()) as PiUserResponse;
    } catch (fetchError: unknown) {
      const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error('[PI_PLATFORM_FETCH_ERROR]', message);
      return NextResponse.json(
        { success: false, error: 'PI_PLATFORM_UNREACHABLE' },
        { status: 503 }
      );
    }

    const verifiedUid = typeof piUserData?.uid === 'string' ? piUserData.uid.trim() : '';
    const verifiedUsername =
      typeof piUserData?.username === 'string' ? piUserData.username.trim() : '';

    if (!verifiedUid || !verifiedUsername) {
      return NextResponse.json(
        { success: false, error: 'INVALID_PI_USER_PAYLOAD' },
        { status: 502 }
      );
    }

    const existing = await prisma.pioneerNode.findUnique({
      where: { uid: verifiedUid },
      select: { id: true, isFrozen: true, status: true },
    });

    if (existing?.isFrozen || existing?.status === 'FROZEN') {
      return NextResponse.json(
        { success: false, error: 'NODE_SANCTIONED_FROZEN' },
        { status: 403 }
      );
    }

    const now = new Date();
    const pioneerRecord = await prisma.pioneerNode.upsert({
      where: { uid: verifiedUid },
      update: {
        username: verifiedUsername,
        status: 'ACTIVE',
        lastActivityTimestamp: now,
        lastHeartbeat: now,
      },
      create: {
        uid: verifiedUid,
        username: verifiedUsername,
        tier: 'CITIZEN',
        status: 'ACTIVE',
        uptimeShield: 92.0,
        lastActivityTimestamp: now,
        lastHeartbeat: now,
      },
    });

    if (pioneerRecord.isFrozen) {
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
  } catch (error: unknown) {
    console.error('[API_AUTH_VERIFY_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'DATABASE_WRITE_FAULT' },
      { status: 500 }
    );
  }
}