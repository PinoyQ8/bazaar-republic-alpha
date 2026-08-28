// Location: app/api/mesh-admin/epoch-sweep/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const db: any = prisma;

    // 1. Fetch non-active / dormant nodes safely across NodeStatus enum values
    const dormantNodes = await db.pioneerNode.findMany({
      where: {
        status: { not: "ACTIVE" },
      },
    });

    const abandonedPiHarvest = (dormantNodes || []).reduce(
      (sum: number, node: any) =>
        sum + (node.dormancyPiBalance || node.stakedPi || 0),
      0
    );

    // 2. Fetch or initialize the active EpochBuffer with explicit typing
    let epochBuffer: any = null;
    if (db.epochBuffer) {
      epochBuffer = await db.epochBuffer.findFirst({
        orderBy: { updatedAt: "desc" },
      });

      if (!epochBuffer) {
        epochBuffer = await db.epochBuffer.create({
          data: {
            currentEpoch: 1,
            bufferedFunds: abandonedPiHarvest,
            status: "ACCUMULATING",
          },
        });
      }
    }

    // 3. Fetch active pioneer nodes eligible for epoch yield distribution
    const activePioneers = await db.pioneerNode.findMany({
      where: {
        status: "ACTIVE",
      },
    });

    const activeCount = activePioneers?.length || 0;
    const yieldPerActivePioneer =
      activeCount > 0 ? (abandonedPiHarvest * 0.7) / activeCount : 0;

    // 4. Atomic State Transition
    await db.$transaction(async (tx: any) => {
      // Clear staked balances of swept inactive nodes
      if (dormantNodes && dormantNodes.length > 0) {
        await tx.pioneerNode.updateMany({
          where: {
            status: { not: "ACTIVE" },
          },
          data: {
            stakedPi: 0,
            lastActivityTimestamp: new Date(),
          },
        });
      }

      // Distribute 70% yield share to active pioneers
      if (yieldPerActivePioneer > 0 && activePioneers) {
        for (const pioneer of activePioneers) {
          await tx.pioneerNode.update({
            where: { uid: pioneer.uid },
            data: {
              mbzrBalance: { increment: yieldPerActivePioneer * 1000 },
            },
          });
        }
      }

      // Increment EpochBuffer funds and advance timestamp if model exists
      if (tx.epochBuffer && epochBuffer?.id) {
        await tx.epochBuffer.update({
          where: { id: epochBuffer.id },
          data: {
            bufferedFunds: { increment: abandonedPiHarvest },
            updatedAt: new Date(),
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      epochId: epochBuffer?.id || "GENESIS_EPOCH_01",
      currentEpoch: epochBuffer?.currentEpoch || 1,
      harvestedPi: abandonedPiHarvest,
      activeNodesRewarded: activeCount,
      yieldPerNode: yieldPerActivePioneer,
    });
  } catch (error: any) {
    console.error("[EPOCH-SWEEP ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Epoch sweep execution failed." },
      { status: 500 }
    );
  }
}