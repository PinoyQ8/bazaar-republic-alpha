import type { AppRealm, MeshNetwork } from "@/lib/pi/paymentEnv";

const globalForPrisma = globalThis as unknown as {
  __bzrSettlementPrisma?: any;
};

function getSettlementPrisma(): any {
  if (globalForPrisma.__bzrSettlementPrisma) {
    return globalForPrisma.__bzrSettlementPrisma;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("bzr-db");
    const PrismaClientCtor = mod?.PrismaClient || mod?.default?.PrismaClient;
    if (typeof PrismaClientCtor === "function") {
      globalForPrisma.__bzrSettlementPrisma = new PrismaClientCtor();
      return globalForPrisma.__bzrSettlementPrisma;
    }
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const stdMod = require("@prisma/client");
      const StdCtor = stdMod?.PrismaClient || stdMod?.default?.PrismaClient;
      if (typeof StdCtor === "function") {
        globalForPrisma.__bzrSettlementPrisma = new StdCtor();
        return globalForPrisma.__bzrSettlementPrisma;
      }
    } catch {
      // Prisma client not generated yet
    }
  }

  return null;
}

export interface SettlePiPaymentInput {
  paymentId: string;
  txid: string;
  network: MeshNetwork;
  realm: AppRealm;
  escrowId?: string | null;
  pioneerUid?: string | null;
  merchantUid?: string | null;
  amount?: number | string | null;
  rawPayment?: Record<string, unknown>;
}

function isUniqueConstraintError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return (
    e?.code === "P2002" ||
    /unique constraint|duplicate key/i.test(String(e?.message || ""))
  );
}

export async function settleConfirmedPiPayment(input: SettlePiPaymentInput) {
  const paymentId = String(input.paymentId || "").trim();
  const txid = String(input.txid || "").trim();

  if (!paymentId || !txid) {
    throw new Error("[SETTLEMENT_HOOK] Both paymentId and txid are required.");
  }

  const rawAmountNum =
    typeof input.amount === "number"
      ? input.amount
      : typeof input.amount === "string" && input.amount.trim() !== ""
      ? Number(input.amount.trim())
      : NaN;

  if (!Number.isFinite(rawAmountNum) || rawAmountNum <= 0) {
    throw new Error(
      `[SETTLEMENT_HOOK] Invalid payment amount: ${String(input.amount)}`
    );
  }

  const numericAmount = rawAmountNum;
  const prisma = getSettlementPrisma();
  const cleanPioneerUid = input.pioneerUid?.trim() || null;
  const payerUid = cleanPioneerUid || "pioneer_unverified";
  const merchantUid =
    input.merchantUid?.trim() ||
    process.env.PI_MERCHANT_UID?.trim() ||
    "bazaar_merchant";

  let paymentRecorded = false;
  let escrowUpdated = false;
  let ledgerRecorded = false;
  let auditRecorded = false;
  let nodeFrozen = false;
  const warnings: string[] = [];

  if (!prisma) {
    warnings.push("PRISMA_CLIENT_UNAVAILABLE");
  }

  // Optional sanction/freeze guard when pioneerNode model is present
  if (cleanPioneerUid && prisma?.pioneerNode?.findUnique) {
    try {
      const node = await prisma.pioneerNode.findUnique({
        where: { uid: cleanPioneerUid },
      });
      if (node?.isFrozen || String(node?.status || "").toUpperCase() === "FROZEN") {
        nodeFrozen = true;
        warnings.push(`NODE_FROZEN:${cleanPioneerUid}`);
      }
    } catch (err) {
      warnings.push(
        `NODE_SANCTION_CHECK_FAILED:${(err as Error)?.message || "unknown"}`
      );
    }
  }

  if (prisma?.payment?.upsert && cleanPioneerUid) {
    try {
      await prisma.payment.upsert({
        where: { paymentId },
        update: {
          txid,
          amount: numericAmount,
          status: "COMPLETED",
        },
        create: {
          paymentId,
          txid,
          payerUid,
          merchantUid,
          amount: numericAmount,
          status: "COMPLETED",
        },
      });
      paymentRecorded = true;
    } catch (err) {
      const msg = (err as Error)?.message || String(err);
      console.warn("[SETTLEMENT_HOOK] Payment upsert skipped/failed:", err);
      warnings.push(`PAYMENT_UPSERT_FAILED:${msg}`);
    }
  } else if (prisma?.payment?.upsert && !cleanPioneerUid) {
    warnings.push("MISSING_PIONEER_UID_FOR_PAYMENT_UPSERT");
  }

  const cleanEscrowId = input.escrowId?.trim() || null;
  if (cleanEscrowId && prisma?.escrowLock?.updateMany) {
    try {
      const updateResult = await prisma.escrowLock.updateMany({
        where: {
          escrowId: cleanEscrowId,
          status: { in: ["PENDING_ONCHAIN", "LOCKED"] },
        },
        data: {
          paymentId,
          txid,
        },
      });
      if (typeof updateResult?.count === "number" && updateResult.count === 0) {
        warnings.push(
          `ESCROW_NOT_ELIGIBLE_OR_MISSING:${cleanEscrowId}`
        );
      } else {
        escrowUpdated = true;
      }
    } catch (err) {
      const msg = (err as Error)?.message || String(err);
      console.warn("[SETTLEMENT_HOOK] EscrowLock update skipped/failed:", err);
      warnings.push(`ESCROW_UPDATE_FAILED:${msg}`);
    }
  }

  if (prisma?.meshLedger?.findFirst && prisma?.meshLedger?.create) {
    try {
      const existing = await prisma.meshLedger.findFirst({
        where: {
          OR: [{ txSignature: txid }, { txHash: txid }],
        },
      });

      if (!existing) {
        await prisma.meshLedger.create({
          data: {
            txSignature: txid,
            txHash: txid,
            txType: "SERVICE_SETTLEMENT",
            fromUid: cleanPioneerUid,
            toUid: merchantUid,
            piAmount: numericAmount,
            amount: numericAmount,
            status: "CONFIRMED",
            description: `[${input.realm}/${input.network}] Pi payment ${paymentId} settled`,
          },
        });
      }
      ledgerRecorded = true;
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        // Concurrent settlement for the same txid already inserted the ledger entry
        ledgerRecorded = true;
      } else {
        const msg = (err as Error)?.message || String(err);
        console.warn("[SETTLEMENT_HOOK] MeshLedger write skipped/failed:", err);
        warnings.push(`MESH_LEDGER_FAILED:${msg}`);
      }
    }
  }

  if (prisma?.auditLog?.create) {
    try {
      await prisma.auditLog.create({
        data: {
          action: "PI_PAYMENT_SETTLED",
          nodeId: cleanPioneerUid || input.realm,
          payload: JSON.stringify({
            paymentId,
            txid,
            network: input.network,
            realm: input.realm,
            escrowId: cleanEscrowId,
            amount: numericAmount,
            nodeFrozen,
          }),
        },
      });
      auditRecorded = true;
    } catch (err) {
      const msg = (err as Error)?.message || String(err);
      console.warn("[SETTLEMENT_HOOK] AuditLog write skipped/failed:", err);
      warnings.push(`AUDIT_LOG_FAILED:${msg}`);
    }
  }

  return {
    settledAt: new Date().toISOString(),
    paymentId,
    txid,
    network: input.network,
    realm: input.realm,
    escrowId: cleanEscrowId,
    nodeFrozen,
    partialFailure: warnings.length > 0,
    warnings,
    persistence: {
      paymentRecorded,
      escrowUpdated,
      ledgerRecorded,
      auditRecorded,
    },
  };
}