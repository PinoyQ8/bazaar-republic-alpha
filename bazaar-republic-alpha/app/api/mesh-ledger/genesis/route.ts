import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateMigrationHash } from '@/app/lib/mesh-crypto';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { uid, stakedAmount } = await req.json();

    // 🛡️ STEP 1: Generate the Cryptographic Bridge Key
    const newMigrationHash = generateMigrationHash();

    // 🛡️ STEP 2: Update the Pioneer Node
    const updatedNode = await prisma.pioneerNode.update({
      where: { uid: uid },
      data: {
        status: "ACTIVE",
        stakedPi: { increment: stakedAmount },
        migrationHash: newMigrationHash, // INJECTING THE KEY
        // ... any other genesis logic (mBZR minting, etc.)
      },
    });

    // 🛡️ STEP 3: Return the Hash to the Pioneer (ONE TIME ONLY)
    return NextResponse.json({ 
      success: true, 
      message: "Genesis Mint Complete. Save your Migration Hash securely.",
      migrationHash: newMigrationHash // They must copy this from their UI
    });

  } catch (error) {
    console.error("[MESH] Genesis Mint Error:", error);
    return NextResponse.json({ error: "Failed to mint and generate hash" }, { status: 500 });
  }
}