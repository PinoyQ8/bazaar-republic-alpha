import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { adminKey, targetEpochMonth } = await req.json();

    // 🛡️ SECURITY SHIELD: Vercel Cron or Manual X570 Trigger Only
    if (adminKey !== process.env.PI_API_KEY) {
      return NextResponse.json({ error: "UNAUTHORIZED: Vault Key invalid." }, { status: 403 });
    }

    if (!targetEpochMonth) {
      return NextResponse.json({ error: "INVALID PAYLOAD: Target Epoch Month (e.g., '2026-08') required." }, { status: 400 });
    }

    // 🛡️ PHASE 1: THE DEAD MAN'S SWEEP (365-Day Rule)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const dormantNodes = await prisma.pioneerNode.findMany({
      where: {
        quarantineStatus: "QUARANTINED",
        quarantineDate: { lte: oneYearAgo }
      }
    });

    // Calculate total abandoned Pi
    const abandonedPiHarvest = dormantNodes.reduce((sum, node) => sum + node.dormancyPiBalance, 0);

    // 🛡️ PHASE 2: LOCATE THE CURRENT EPOCH BUFFER
    const epochBuffer = await prisma.epochBuffer.findUnique({
      where: { epochMonth: targetEpochMonth }
    });

    if (!epochBuffer || epochBuffer.status === "DISTRIBUTED") {
      return NextResponse.json({ error: "EPOCH ERROR: Buffer not found or already distributed." }, { status: 400 });
    }

    // Total Pi to distribute (E-Network Fees + Swept Abandoned Pi)
    const totalPiToDistribute = epochBuffer.totalPiCollected + abandonedPiHarvest;

    // 🧮 THE 70/30 MATRIX MATH
    const treasuryPolShare = totalPiToDistribute * 0.30;
    const pioneerYieldShare = totalPiToDistribute * 0.70;

    // 🛡️ PHASE 3: FETCH ACTIVE PIONEERS FOR YIELD (92% Uptime Shield Eligible)
    const activePioneers = await prisma.pioneerNode.findMany({
      where: { status: "ACTIVE", stakeWeight: { gt: 0 } }
    });

    // 🛡️ PHASE 4: ATOMIC EXECUTION (The Database Transaction)
    // We execute the liquidations, the distributions, and close the epoch in one atomic blast.
    const transactionQueue: any[] = [];

    // A. Liquidate the Dormant Nodes
    if (dormantNodes.length > 0) {
      transactionQueue.push(
        prisma.pioneerNode.updateMany({
          where: {
            quarantineStatus: "QUARANTINED",
            quarantineDate: { lte: oneYearAgo }
          },
          data: {
            quarantineStatus: "ABANDONED",
            dormancyPiBalance: 0,
            dormancyMBzrBalance: 0,
            migrationHash: null // Burn the keys
          }
        })
      );
    }

    // B. Distribute Yield to Active Pioneers
    activePioneers.forEach(pioneer => {
      const pioneerYield = pioneerYieldShare * pioneer.stakeWeight;
      transactionQueue.push(
        prisma.pioneerNode.update({
          where: { id: pioneer.id },
          data: {
            stakedPi: { increment: pioneerYield },
            lastEpochYield: pioneerYield
          }
        })
      );
    });

    // C. Lock the Epoch Buffer and Route Treasury Share
    transactionQueue.push(
      prisma.epochBuffer.update({
        where: { id: epochBuffer.id },
        data: {
          status: "DISTRIBUTED",
          totalPiCollected: totalPiToDistribute,
          pioneerYieldShare: pioneerYieldShare,
          treasuryPolShare: treasuryPolShare,
          executedAt: new Date()
        }
      })
    );

    // 🚀 EXECUTE THE MATRIX
    await prisma.$transaction(transactionQueue);

    // 🛡️ PHASE 5: TELEMETRY REPORT
    return NextResponse.json({
      success: true,
      message: `Epoch ${targetEpochMonth} Successfully Distributed.`,
      telemetry: {
        liquidatedNodes: dormantNodes.length,
        abandonedPiHarvested: abandonedPiHarvest,
        networkFeesCollected: epochBuffer.totalPiCollected,
        totalPiDistributed: totalPiToDistribute,
        treasuryAllocation: treasuryPolShare,
        pioneerAllocation: pioneerYieldShare
      }
    });

  } catch (error) {
    console.error("[MESH] Epoch Distribution Error:", error);
    return NextResponse.json({ error: "Epoch Sweep failed. Check MESH logs." }, { status: 500 });
  }
}