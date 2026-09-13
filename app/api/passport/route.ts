// app/api/passport/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('wallet') || searchParams.get('uid');

    if (!walletAddress) {
      return NextResponse.json({ active: false, reason: 'NO_WALLET_PROVIDED' }, { status: 400 });
    }

    // Isolated read with count query safeguard
    const node = await prisma.pioneerNode.findFirst({
      where: { walletAddress },
      select: {
        id: true,
        uptimeShield: true,
        tier: true,
        modulesCleared: true,
      },
    });

    // Passport is valid if node exists and has completed onboarding modules
    const hasPassport = Boolean(node && (node.modulesCleared ?? 0) >= 3);

    return NextResponse.json({
      active: hasPassport,
      node: node || null,
      tier: node?.tier || 'CADET',
      uptimeShield: node?.uptimeShield || 92.0,
    });
  } catch (error: any) {
    console.error('[PASSPORT_QUERY_ERROR]:', error?.message);
    // Return structured degraded state to prevent unhandled UI rejection
    return NextResponse.json(
      { active: false, degraded: true, error: 'STATE_LEDGER_TEMPORARILY_OFFLINE' },
      { status: 200 }
    );
  }
}