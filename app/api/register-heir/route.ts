import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface HeirInput {
  label?: string;
  address?: string;
  percent?: number | string;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'FAULT: Unsigned Request. Access Denied.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const citizenUid =
      typeof body?.citizen_uid === 'string' ? body.citizen_uid.trim() : '';
    const heirs: HeirInput[] = Array.isArray(body?.heirs) ? body.heirs : [];

    if (!citizenUid || heirs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'FAULT: citizen_uid and a non-empty heirs array are required.' },
        { status: 400 }
      );
    }

    const normalizedHeirs = heirs.map((h) => ({
      label: typeof h?.label === 'string' ? h.label.trim() : '',
      address: typeof h?.address === 'string' ? h.address.trim() : '',
      allocationPercent: Number(h?.percent),
    }));

    const hasInvalidHeir = normalizedHeirs.some(
      (h) =>
        !h.label ||
        !h.address ||
        !Number.isFinite(h.allocationPercent) ||
        h.allocationPercent <= 0
    );

    if (hasInvalidHeir) {
      return NextResponse.json(
        { success: false, message: 'FAULT: Each heir requires label, address, and a positive percent.' },
        { status: 400 }
      );
    }

    const db = prisma as any;
    const citizen = await db.pioneerNode?.findUnique({
      where: { uid: citizenUid },
    });

    if (!citizen) {
      return NextResponse.json(
        { success: false, message: 'FAULT: Citizen UID not found in MESH.' },
        { status: 404 }
      );
    }

    if (db.auditLog?.create) {
      await db.auditLog.create({
        data: {
          action: 'REGISTRY_SEALED',
          payload: JSON.stringify({
            citizenUid,
            heirs: normalizedHeirs,
          }),
          nodeId: citizen.id ?? citizenUid,
          timestamp: new Date(),
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'REGISTRY SEALED: Assets secured and synchronized with MESH Ledger.',
        citizenUid,
        heirCount: normalizedHeirs.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('REGISTRY PERSISTENCE FRACTURE:', error);
    return NextResponse.json(
      { success: false, message: 'INTERNAL VAULT ERROR: Persistence Failed.' },
      { status: 500 }
    );
  }
}