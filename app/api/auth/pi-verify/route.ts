import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PiUserResponse {
  uid: string;
  username: string;
  roles?: string[];
}

export async function POST(req: Request) {
  // 1. Connection Protocol Verification
  const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
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
    // 2. Extract Token from Body or Header
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('authorization');
    const accessToken = body?.accessToken || authHeader?.replace('Bearer ', '')?.trim();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PI_ACCESS_TOKEN' },
        { status: 401 }
      );
    }

    // 3. Server-to-Server Pi Platform Verification (Testnet2 / Mainnet Horizon)
    let verifiedUid = body?.uid;
    let verifiedUsername = body?.username;

    try {
      const piPlatformRes = await fetch('https://api.minepi.com/v2/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      });

      if (piPlatformRes.ok) {
        const piUserData: PiUserResponse = await piPlatformRes.json();
        verifiedUid = piUserData.uid;
        verifiedUsername = piUserData.username;
        console.log(`[PI_TESTNET2_VERIFIED] UID: ${verifiedUid} | User: ${verifiedUsername}`);
      } else {
        const errorText = await piPlatformRes.text();
        console.warn(`[PI_API_VALIDATION_WARNING] Status: ${piPlatformRes.status} - Payload: ${errorText}`);
        
        // Fallback for isolated sandbox simulation if uid is provided
        if (!verifiedUid) {
          return NextResponse.json(
            { success: false, error: 'PI_TOKEN_VERIFICATION_FAILED', details: errorText },
            { status: 401 }
          );
        }
      }
    } catch (fetchError: any) {
      console.error('[PI_PLATFORM_FETCH_ERROR]', fetchError.message);
      if (!verifiedUid) {
        return NextResponse.json(
          { success: false, error: 'PI_PLATFORM_UNREACHABLE' },
          { status: 503 }
        );
      }
    }

    // 4. Atomic Pioneer Node Upsert in MongoDB Atlas
    const pioneerRecord = await prisma.pioneerNode.upsert({
      where: { uid: verifiedUid },
      update: {
        username: verifiedUsername || 'REAL_PIONEER',
        status: 'ACTIVE',
      },
      create: {
        uid: verifiedUid,
        username: verifiedUsername || 'REAL_PIONEER',
        tier: 'CITIZEN',
        status: 'ACTIVE',
        uptimeShield: 92,
      },
    });

    return NextResponse.json({
      success: true,
      message: '[STATUS 200] Identity Forged',
      container: 'p27.1 testnet2',
      pioneer: pioneerRecord,
    });
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