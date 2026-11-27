import type { AppRealm, MeshNetwork } from "@/lib/pi/paymentEnv";
import { prisma as appPrisma } from "@/lib/prisma";

const globalForPrisma = globalThis as unknown as {
  __bzrSettlementPrisma?: any;
};

type DynamicRequireFn = (id: string) => unknown;

function getIndirectRequire(): DynamicRequireFn | null {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      "return typeof require === 'function' ? require : null;"
    ) as () => unknown;
    const req = fn();
    return typeof req === "function" ? (req as DynamicRequireFn) : null;
  } catch {
    return null;
  }
}

function getSettlementPrisma(): any {
  if (appPrisma) {
    return appPrisma;
  }

  if (globalForPrisma.__bzrSettlementPrisma) {
    return globalForPrisma.__bzrSettlementPrisma;
  }

  const nodeRequire = getIndirectRequire();
  if (!nodeRequire) {
    return null;
  }

  for (const specifier of ["@prisma/client", "bzr-db"]) {
    try {
      const mod = nodeRequire(specifier) as
        | { PrismaClient?: unknown; default?: { PrismaClient?: unknown } }
        | null;
      const PrismaClientCtor = mod?.PrismaClient ?? mod?.default?.PrismaClient;
      if (typeof PrismaClientCtor === "function") {
        globalForPrisma.__bzrSettlementPrisma = new (PrismaClientCtor as new () => unknown)();
        return globalForPrisma.__bzrSettlementPrisma;
      }
    } catch {
      // Fallback if client module is unavailable
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

function normalizePositiveAmount(amount: number | string | null | undefined): number {
  const numeric =
    typeof amount === "number"
      ? amount
      : typeof amount === "string" && amount.trim() !== ""
      ? Number(amount.trim())
      : NaN;

  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(
      `[SETTLEMENT_HOOK] Invalid payment amount: ${String(amount)}`
    );
  }

  return numeric;
}

export async function settleConfirmedPiPayment(input: SettlePiPaymentInput) {
  const paymentId = String(input.paymentId || "").trim();
  const txid = String(input.txid || "").trim();

  if (!paymentId || !txid) {
    throw new Error("[SETTLEMENT_HOOK] Both paymentId and txid are required.");
  }

  const numericAmount = normalizePositiveAmount(input.amount);
  const prisma = getSettlementPrisma();
  const cleanPioneerUid = input.pioneerUid?.trim() || null;
  const merchantUid =
    input.merchantUid?.trim() ||
    process.env.PI_MERCHANT_UID?.trim() ||
    "bazaar_merchant";
  const cleanEscrowId = input.escrowId?.trim() || null;

  let paymentRecorded = false;
  let escrowUpdated = false;
  let ledgerRecorded = false;
  let auditRecorded = false;
  let nodeFrozen = false;
  const warnings: string[] = [];

  if (!prisma) {
    warnings.push("PRISMA_CLIENT_UNAVAILABLE");
  }

  if (cleanPioneerUid && prisma?.pioneerNode?.findUnique) {
    try {
      const node = await prisma.pioneerNode.findUnique({
        where: { uid: cleanPioneerUid },
      });
      if (
        node?.isFrozen ||
        String(node?.status || "").toUpperCase() === "FROZEN"
      ) {
        nodeFrozen = true;
        warnings.push(`NODE_FROZEN:${cleanPioneerUid}`);
      }
    } catch (err) {
      warnings.push(
        `NODE_SANCTION_CHECK_FAILED:${(err as Error)?.message || "unknown"}`
      );
    }
  }

  if (prisma?.payment?.upsert) {
    if (!cleanPioneerUid) {
      warnings.push("MISSING_PIONEER_UID_FOR_PAYMENT_UPSERT");
    } else {
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
            payerUid: cleanPioneerUid,
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
    }
  }

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
        warnings.push(`ESCROW_NOT_ELIGIBLE_OR_MISSING:${cleanEscrowId}`);
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
            merchantUid,
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