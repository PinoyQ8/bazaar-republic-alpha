// Location: app/api/escrow/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyNodeExecution } from "@/lib/rbac/guard";
import { Permission } from "@/lib/rbac/permissions";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { consumerUid, providerId, amount, serviceDescription, timelockHours = 48 } = body;

    if (!consumerUid || !amount) {
      return NextResponse.json(
        { error: "MISSING_REQUIRED_FIELDS", details: "consumerUid and amount are mandatory." },
        { status: 400 }
      );
    }

    // 1. RBAC Cryptographic Gate: Enforce Module 01 Clearance
    const rbac = await verifyNodeExecution(consumerUid, Permission.EXECUTE_ESCROW_LOCK);

    if (!rbac.authorized) {
      return NextResponse.json(
        {
          error: rbac.reason,
          quarantined: rbac.quarantined,
          remedialModule: rbac.remedialModule,
          remedialUrl: `/academy/module-${rbac.remedialModule || "01"}`,
        },
        { status: rbac.quarantined ? 423 : 403 }
      );
    }

    // 2. Resolve Service Provider (explicit typing prevents 'never' narrowing)
    const db = prisma as any;
    let targetProvider: any = null;

    if (providerId) {
      targetProvider = await db.serviceProvider.findUnique({ where: { id: providerId } });
    }
    if (!targetProvider) {
      targetProvider = await db.serviceProvider.findFirst();
    }

    if (!targetProvider) {
      return NextResponse.json(
        { error: "NO_ACTIVE_SERVICE_PROVIDER_FOUND" },
        { status: 404 }
      );
    }

    // 3. Compute Deterministic Escrow Lock
    const escrowId = `escrow_${crypto.randomBytes(8).toString("hex")}`;
    const timelockExpiresAt = new Date(Date.now() + timelockHours * 60 * 60 * 1000);

    const lock = await db.escrowLock.create({
      data: {
        escrowId,
        paymentId: `pay_${crypto.randomBytes(6).toString("hex")}`,
        txid: `tx_${crypto.randomBytes(12).toString("hex")}`,
        consumerUid,
        providerId: targetProvider.id,
        amount: parseFloat(Number(amount).toFixed(7)),
        token: "PI",
        status: "LOCKED",
        timelockExpiresAt,
        serviceDescription: serviceDescription || "Mesh Marketplace Escrow Settlement",
      },
    });

    return NextResponse.json({
      success: true,
      escrowId: lock.escrowId,
      status: lock.status,
      timelockExpiresAt: lock.timelockExpiresAt,
      amount: lock.amount,
      token: lock.token,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "ESCROW_CREATION_FAILED", details: error.message },
      { status: 500 }
    );
  }
}