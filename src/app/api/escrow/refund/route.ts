import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = body.escrowId || body.id;
    const reason = body.reason || "Manual pioneer refund issued";
    const settledByNode = body.settledByNode || "Node-001-X570-Taichi";
    const releaseTxHash = body.releaseTxHash || `soroban_refund_${Math.random().toString(36).substring(2, 12)}`;

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "MISSING_IDENTIFIER: 'escrowId' or 'id' is required." },
        { status: 400 }
      );
    }

    const db = prisma as any;

    let target = await db.escrowLock.findFirst({
      where: { escrowId: identifier }
    });

    if (!target && /^[0-9a-fA-F]{24}$/.test(identifier)) {
      target = await db.escrowLock.findUnique({
        where: { id: identifier }
      });
    }

    if (!target) {
      return NextResponse.json(
        { success: false, error: `NOT_FOUND: Escrow '${identifier}' not found.` },
        { status: 404 }
      );
    }

    if (target.status !== "LOCKED" && target.status !== "DISPUTED") {
      return NextResponse.json(
        { success: false, error: `INVALID_STATE: Escrow status is '${target.status}'. Only 'LOCKED' or 'DISPUTED' escrows can be refunded.` },
        { status: 400 }
      );
    }

    const updated = await db.escrowLock.update({
      where: { id: target.id },
      data: {
        status: "REFUNDED",
        settledByNode,
        releasedAt: new Date(),
        releaseTxHash,
        serviceDescription: `${target.serviceDescription} [REFUND REASON: ${reason}]`,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Escrow refunded successfully.",
        escrow: updated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API_ESCROW_REFUND_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to refund escrow." },
      { status: 500 }
    );
  }
}
