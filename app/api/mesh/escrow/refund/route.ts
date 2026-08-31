// app/api/mesh/escrow/refund/route.ts
import { NextResponse } from 'next/server';
import { db as prisma } from "@/lib/db"; // Safely imports our dual-export singleton

export async function POST(req: Request) {
  try {
    const { escrowId, initiatorUid, reason } = await req.json();

    if (!escrowId || !initiatorUid) {
      return NextResponse.json({ success: false, error: "Missing required parameters." }, { status: 400 });
    }

    // 1. Fetch the active escrow lock
    const lock = await prisma.escrowLock.findUnique({
      where: { escrowId }
    });

    // 2. Verify state (Only LOCKED or DISPUTED escrows can be refunded)
    if (!lock || (lock.status !== 'LOCKED' && lock.status !== 'DISPUTED')) {
      return NextResponse.json({ success: false, error: "Invalid escrow state for refund." }, { status: 400 });
    }

    // 3. Execute Atomic Refund Transaction
    const refundTx = await prisma.$transaction([
      prisma.escrowLock.update({
        where: { escrowId },
        data: { 
          status: 'REFUNDED',
          updatedAt: new Date()
        }
      }),
      prisma.auditLog.create({
        data: {
          action: 'ESCROW_REFUND',
          nodeId: initiatorUid, // Maps the Pioneer/Operator UID to nodeId
          payload: JSON.stringify({
            escrowId,
            reason: reason || "Refund initiated by provider or adjudicator.",
            refundedAt: new Date().toISOString()
          })
        }
      })
    ]);

    return NextResponse.json({ 
        success: true, 
        message: "Escrow successfully refunded.",
        escrow: refundTx[0] 
    });

  } catch (error: any) {
    console.error("[MESH FAULT] Escrow Refund Error:", error);
    return NextResponse.json({ success: false, error: "Internal refund transaction failed." }, { status: 500 });
  }
}