// app/api/academy/genesis-upgrade/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // 🛡️ Import your singleton, never instantiate `new PrismaClient()` here

// 🛡️ CRITICAL: Prevent Next.js from evaluating or pre-rendering this route during build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    // 🛡️ Build-time execution shield
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: "Database client unavailable during static analysis." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { uid, passkeyId, publicKey } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Missing Pioneer UID." },
        { status: 400 }
      );
    }

    // Execute your node upgrade logic inside the request handler
    const updatedNode = await (prisma as any).pioneerNode.upsert({
      where: { uid },
      update: {
        genesisCompleted: true,
        passkeyId: passkeyId || undefined,
        publicKey: publicKey || undefined,
        updatedAt: new Date(),
      },
      create: {
        uid,
        username: "PIONEER_NODE",
        genesisCompleted: true,
        passkeyId: passkeyId || undefined,
        publicKey: publicKey || undefined,
        tier: "CITIZEN",
      },
    });

    return NextResponse.json({ success: true, node: updatedNode }, { status: 200 });
  } catch (error: any) {
    console.error("[GENESIS_UPGRADE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process genesis upgrade." },
      { status: 500 }
    );
  }
}