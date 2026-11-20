import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = prisma as any;

    // Safely query Prisma if proposal / internalProposal model exists; otherwise use seed items
    const dbProposals = await (
      db.proposal?.findMany?.({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }) ??
      db.internalProposal?.findMany?.({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }) ??
      Promise.resolve([])
    ).catch(() => []);

    if (Array.isArray(dbProposals) && dbProposals.length > 0) {
      return NextResponse.json(
        { status: 'SUCCESS', source: 'LEDGER_DB', data: dbProposals },
        { status: 200 }
      );
    }

    const now = Date.now();
    const initialProposals = [
      {
        id: 'PROP-2026-01',
        title: 'Scale mBZR Daily Node Distribution Cap to 25.0 Units',
        description:
          'Proposal to scale active node distribution cap from 10.0 to 25.0 mBZR based on sustained node uptime stability.',
        category: 'TREASURY',
        status: 'ACTIVE',
        yesVotes: 1420,
        noVotes: 180,
        quorum: 75,
        expiresAt: new Date(now + 86400000 * 3).toISOString(),
      },
      {
        id: 'PROP-2026-02',
        title: 'Authorize Soroban Protocol 28 Relay Subnet Gateway',
        description:
          'Authorize automated peer discovery across secondary relay subnets to enhance decentralized mesh resilience.',
        category: 'PROTOCOL',
        status: 'ACTIVE',
        yesVotes: 2100,
        noVotes: 45,
        quorum: 88,
        expiresAt: new Date(now + 86400000 * 5).toISOString(),
      },
    ];

    return NextResponse.json(
      {
        status: 'SUCCESS',
        source: 'SEED_INITIALIZER',
        data: initialProposals,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[MESH ERROR] Governance Read Failure:', error);
    return NextResponse.json(
      { status: 'ERROR', message: 'Governance telemetry offline.' },
      { status: 500 }
    );
  }
}