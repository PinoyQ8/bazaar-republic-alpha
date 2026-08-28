import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Accept either escrowId or id from any client payload
    const identifier = body.escrowId || body.id;
    const settledByNode = body.settledByNode || "Node-001-X570-Taichi";
    const releaseTxHash = body.releaseTxHash || `soroban_rel_${Math.random().toString(36).substring(2, 12)}`;

    if (!identifier) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_FIELDS: 'escrowId' or 'id' parameter is required.",
          received: body
        },
        { status: 400 }
      );
    }

    const db = prisma as any;

    // Search by escrowId first
    let target = await db.escrowLock.findFirst({
      where: { escrowId: identifier }
    });

    // Fallback: search by MongoDB ObjectId if identifier matches 24-hex pattern
    if (!target && /^[0-9a-fA-F]{24}$/.test(identifier)) {
      target = await db.escrowLock.findUnique({
        where: { id: identifier }
      });
    }

    if (!target) {
      return NextResponse.json(
        { success: false, error: `NOT_FOUND: Escrow record '${identifier}' was not found.` },
        { status: 404 }
      );
    }

    if (target.status !== "LOCKED") {
      return NextResponse.json(
        { success: false, error: `INVALID_STATE: Escrow status is '${target.status}'. Only 'LOCKED' escrows can be released.` },
        { status: 400 }
      );
    }

    const updated = await db.escrowLock.update({
      where: { id: target.id },
      data: {
        status: "RELEASED",
        settledByNode,
        releasedAt: new Date(),
        releaseTxHash,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Escrow settled and released successfully.",
        escrow: updated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API_ESCROW_RELEASE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to release escrow." },
      { status: 500 }
    );
  }
}
