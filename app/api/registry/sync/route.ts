import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawLimit = Number(searchParams.get('limit'));
    const take =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.floor(rawLimit), 500)
        : 100;

    const registryDirectory = await prisma.pioneerNode.findMany({
      orderBy: {
        lastActivityTimestamp: 'desc',
      },
      take,
    });

    return NextResponse.json(
      {
        status: 'REGISTRY_SYNC_SUCCESS',
        count: registryDirectory.length,
        directory: registryDirectory,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADJUDICATOR] Read-Path Fracture:', error);
    return NextResponse.json(
      { status: 'FRACTURE', message: 'Registry sync failed.' },
      { status: 500 }
    );
  }
}