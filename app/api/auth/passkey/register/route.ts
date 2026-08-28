import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pioneerUid, credentialId, publicKey, transports } = body;

    if (!pioneerUid || !credentialId || !publicKey) {
      return NextResponse.json(
        { error: 'Missing required passkey registration fields' },
        { status: 400 }
      );
    }

    // 🛡️ Type-safe assertion bypass for runtime synchronization
    const db = prisma as any;

    // Verify if PioneerNode exists
    const pioneer = await db.pioneerNode.findUnique({
      where: { uid: pioneerUid },
    });

    if (!pioneer) {
      return NextResponse.json(
        { error: 'Pioneer node not found in registry' },
        { status: 404 }
      );
    }

    const newCredential = await db.passkeyCredential.upsert({
      where: { credentialId },
      update: {
        counter: { increment: 1 },
      },
      create: {
        credentialId,
        pioneerUid,
        publicKey,
        transports: transports || ['internal'],
      },
    });

    return NextResponse.json(
      { success: true, credentialId: newCredential.credentialId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Passkey Registration Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error during passkey binding' },
      { status: 500 }
    );
  }
}