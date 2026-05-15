// 🛡️ MESH: Direct Relative Bridge (Bypasses the alias fracture)
import { prisma } from '@/lib/mesh-prisma';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { citizenUid, initiatorHeir } = await req.json();

    // 🛡️ MESH-SCAN: Check for existing active STASIS
    const activeStasis = await prisma.recoveryLedger.findFirst({
      where: {
        citizenUid,
        status: 'STASIS',
      },
    });

    if (activeStasis) {
      return NextResponse.json(
        { error: 'Adjudicator Alert: Node already in STASIS.' },
        { status: 409 }
      );
    }

    // 🛡️ LOGIC GINGE: Calculate the 24-hour countdown
    const stasisStart = new Date();
    const stasisEnd = new Date(stasisStart.getTime() + 24 * 60 * 60 * 1000);

    const newLedgerEntry = await prisma.recoveryLedger.create({
      data: {
        citizenUid,
        initiatorHeir,
        stasisStart,
        stasisEnd,
        status: 'STASIS',
        userAgent: req.headers.get('user-agent'),
      },
    });

    return NextResponse.json({ 
      message: 'STASIS Active. 24-hour countdown initiated.',
      ledgerId: newLedgerEntry.id,
      unlockTime: stasisEnd
    });

  } catch (error) {
    console.error('MESH FRACTURE:', error);
    return NextResponse.json({ error: 'Internal logic failure.' }, { status: 500 });
  }
}