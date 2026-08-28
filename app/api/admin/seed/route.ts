// Location: app/api/admin/seed/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 🛡️ Schema v2.7.2 singleton

export async function POST() {
  try {
    const db = prisma as any;

    // 🛡️ Explicitly type accumulator arrays to resolve TS2345 (never[] inference)
    const seededNodes: any[] = [];
    const seededTransactions: any[] = [];

    // 1. Clean existing mock data
    if (db.meshLedger) {
      await db.meshLedger.deleteMany({});
    }

    // 2. Define Mock Genesis Node Fleet
    const mockNodes = [
      {
        uid: "usr_pioneer_genesis_01",
        stakedPi: 100.0,
        mbzrBalance: 100000.0,
      },
      {
        uid: "usr_pioneer_genesis_02",
        stakedPi: 50.0,
        mbzrBalance: 50000.0,
      },
    ];

    // 3. Upsert Nodes and Seed Initial Ledger Transactions
    for (const nodeData of mockNodes) {
      const node = await db.pioneerNode.upsert({
        where: { uid: nodeData.uid },
        update: {
          stakedPi: nodeData.stakedPi,
          mbzrBalance: nodeData.mbzrBalance,
          status: "ACTIVE",
          lastActivityTimestamp: new Date(),
        },
        create: {
          uid: nodeData.uid,
          stakedPi: nodeData.stakedPi,
          mbzrBalance: nodeData.mbzrBalance,
          status: "ACTIVE",
          uptimeShield: 100.0,
          trustScore: 100.0,
        },
      });
      seededNodes.push(node);

      if (nodeData.stakedPi > 0) {
        const tx = await db.meshLedger.create({
          data: {
            walletId: nodeData.uid,
            txSignature: `genesis_mint_${nodeData.uid}_${Date.now()}`,
            txType: "GENESIS_MINT",
            piAmount: Number(nodeData.stakedPi) || 0,
            mbzrAmount: Number(nodeData.mbzrBalance) || 0,
            status: "CONFIRMED",
            createdAt: new Date(),
          },
        });
        seededTransactions.push(tx);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Genesis node fleet and ledger seeded successfully.",
      seededNodesCount: seededNodes.length,
      transactions: seededTransactions,
    });
  } catch (error: any) {
    console.error("[ADMIN/SEED ERROR]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute database seed." },
      { status: 500 }
    );
  }
}