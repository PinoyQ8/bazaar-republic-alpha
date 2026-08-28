import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 🛡️ MESH SAFE-GUARD: Safely query Prisma if model exists, otherwise bypass to seed layer
    const dbProposals = await (prisma as any).proposal?.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    }).catch(() => []);

    if (dbProposals && dbProposals.length > 0) {
      return NextResponse.json({ status: 'SUCCESS', data: dbProposals });
    }

    // Default Seed Proposals for E-Network Initialization
    const initialProposals = [
      {
        id: "PROP-2026-01",
        title: "Increase TESTMBZR Daily Payout Cap to 25.0 Tokens",
        description: "Proposal to scale active node distribution cap from 10.0 to 25.0 TESTMBZR based on 92% Uptime Shield stability.",
        category: "TREASURY",
        status: "ACTIVE",
        yesVotes: 1420,
        noVotes: 180,
        quorum: 75,
        expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days remaining
      },
      {
        id: "PROP-2026-02",
        title: "Integrate Protocol 26.1 Subnet Gateway",
        description: "Authorize automated peer discovery across secondary relay subnets to enhance decentralized mesh resilience.",
        category: "PROTOCOL",
        status: "ACTIVE",
        yesVotes: 2100,
        noVotes: 45,
        quorum: 88,
        expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days remaining
      }
    ];

    return NextResponse.json({ 
      status: 'SUCCESS', 
      source: 'SEED_INITIALIZER',
      data: initialProposals 
    });

  } catch (error) {
    console.error("[MESH ERROR] Governance Read Failure:", error);
    return NextResponse.json(
      { status: 'ERROR', message: "Governance telemetry offline." }, 
      { status: 500 }
    );
  }
}