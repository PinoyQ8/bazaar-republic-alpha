import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // 🛡️ Database Bridge

// 🛡️ THE PEG: Immutable Protocol Constants
const PI_TO_MBZR_RATIO = 1000; // 1 Pi = 1,000 mBZR (Algorithmic Peg)
const MAX_MINT_CAP = 1000;    // 🛡️ ALPHA SAFETY VALVE

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { senderWallet, lockedPiAmount, l1TxSignature } = payload;

    // 1. INBOUND PAYLOAD VALIDATION
    if (!senderWallet || typeof lockedPiAmount !== 'number' || !l1TxSignature) {
      return NextResponse.json(
        { success: false, error: 'MALFORMED_PAYLOAD: Missing required Genesis vectors.' },
        { status: 400 }
      );
    }

    if (lockedPiAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'INVALID_AMOUNT: Deposit must be > 0.' },
        { status: 422 }
      );
    }

    if (lockedPiAmount > MAX_MINT_CAP) {
      console.warn(`[MESH-REJECT] Node [${senderWallet}] attempted mint overflow: ${lockedPiAmount} Pi`);
      return NextResponse.json(
        { success: false, error: `ALPHA-LIMIT: Maximum Genesis Mint is ${MAX_MINT_CAP} Pi.` },
        { status: 422 }
      );
    }

    // 2. LAYER 1 CRYPTOGRAPHIC VERIFICATION
    const isL1SignatureValid = l1TxSignature.startsWith('pi_tx_'); 
    if (!isL1SignatureValid) {
        console.error(`[MESH-REJECT] L1 Signature verification failed for Node [${senderWallet}].`);
        return NextResponse.json(
            { success: false, error: 'SECURITY-FAULT: Invalid L1 blockchain signature.' },
            { status: 403 }
        );
    }

    // 3. SYNTHETIC ASSET GENERATION
    const mintedMbzr = lockedPiAmount * PI_TO_MBZR_RATIO;

    // --- CRITICAL SECTION: DB STATE TRANSITION (CLEAN UPSERT) ---
    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      try {
        await prisma.$transaction([
          prisma.pioneerNode.upsert({
            where: { uid: senderWallet },
            update: {
              stakedPi: { increment: lockedPiAmount },
              mbzrBalance: { increment: mintedMbzr },
              lastActivityTimestamp: new Date(),
            },
            create: {
              uid: senderWallet,
              walletAddress: senderWallet,
              username: `pioneer_${senderWallet.slice(0, 8)}`, // Fallback unique placeholder to prevent key collision
              stakedPi: lockedPiAmount,
              mbzrBalance: mintedMbzr,
              trustScore: 10,
              tier: "CITIZEN",
              status: "ACTIVE",
            }
          }),
          prisma.meshLedger.create({
            data: {
              walletId: senderWallet,
              txSignature: l1TxSignature,
              txType: 'GENESIS_MINT',
              piAmount: lockedPiAmount,
              mbzrAmount: mintedMbzr,
            },
          }),
        ]);
        success = true;
      } catch (dbError: any) {
        retries--;
        console.warn(`[MESH-RETRY] Database operation failed. Retries left: ${retries}. Error: ${dbError.message}`);
        if (retries === 0) throw dbError;
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
    // -----------------------------------------------------------------

    console.log(`[MESH-SYNC] Genesis Mint Authorized.`);
    console.log(` > Node: ${senderWallet}`);
    console.log(` > L1 Deposit: ${lockedPiAmount} Pi`);
    console.log(` > Minted: ${mintedMbzr} mBZR`);

    // 4. TELEMETRY DISPATCH
    return NextResponse.json({
      success: true,
      telemetry: {
        txId: `mint_${crypto.randomUUID()}`,
        l1DepositPi: lockedPiAmount,
        newlyMintedMbzr: mintedMbzr,
        overMintShieldStatus: 'SECURED',
        timestamp: Date.now()
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("[MESH-FRACTURE] API Route Terminated:", error);
    return NextResponse.json(
      { success: false, error: `SERVER-LOGIC-FAULT: ${error.message || 'Genesis ingestion pipeline failed.'}` },
      { status: 500 }
    );
  }
}