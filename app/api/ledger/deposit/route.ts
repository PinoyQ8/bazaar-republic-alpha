// Location: app/api/ledger/deposit/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const db = prisma as any;

    // Fetch latest ledger distributions from MeshLedger (or LedgerLog)
    const logs = db.meshLedger
      ? await db.meshLedger.findMany({
          take: 25,
          orderBy: {
            createdAt: "desc",
          },
        })
      : await db.ledgerLog.findMany({
          take: 25,
          orderBy: {
            timestamp: "desc",
          },
        });

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    console.error("[LEDGER/DEPOSIT GET ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch ledger logs." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, amount, asset = "mBZR", txHash } = body;

    if (!uid || amount === undefined) {
      return NextResponse.json(
        { error: "INVALID_PARAMETERS: Missing uid or amount." },
        { status: 400 }
      );
    }

    const db = prisma as any;
    const numericAmount = Number(amount) || 0;
    const txSignature = txHash || `deposit_${uid}_${Date.now()}`;

    // Atomic ledger entry creation
    const logEntry = db.meshLedger
      ? await db.meshLedger.create({
          data: {
            walletId: uid,
            txSignature,
            txType: "SERVICE_SETTLEMENT",
            mbzrAmount: numericAmount,
            status: "CONFIRMED",
            createdAt: new Date(),
          },
        })
      : await db.ledgerLog.create({
          data: {
            uid,
            amount: String(numericAmount),
            asset,
            txHash: txSignature,
            status: "CONFIRMED",
            timestamp: new Date(),
          },
        });

    return NextResponse.json({
      success: true,
      log: logEntry,
    });
  } catch (error: any) {
    console.error("[LEDGER/DEPOSIT POST ERROR]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record deposit." },
      { status: 500 }
    );
  }
}