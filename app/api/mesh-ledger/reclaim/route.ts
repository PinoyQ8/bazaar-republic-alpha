import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { activeUid, quarantinedUid } = await req.json();

    const result = await (prisma as any).$transaction(async (tx: any) => {
      const qNode = await tx.pioneerNode.findUnique({ where: { uid: quarantinedUid } });
      if (!qNode) throw new Error('Quarantined node not found');

      const reclaimAmount = qNode.mbzrBalance || 0;

      await tx.pioneerNode.update({
        where: { uid: quarantinedUid },
        data: { mbzrBalance: 0, status: 'FROZEN' },
      });

      await tx.pioneerNode.update({
        where: { uid: activeUid },
        data: { mbzrBalance: { increment: reclaimAmount } },
      });

      return { reclaimed: reclaimAmount };
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
