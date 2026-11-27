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

export async function settleConfirmedPiPayment(input: SettlePiPaymentInput) {
  const numericAmount =
    typeof input.amount === "number"
      ? input.amount
      : typeof input.amount === "string" && Number.isFinite(Number(input.amount))
      ? Number(input.amount)
      : 0;

  const prisma = getSettlementPrisma();
  const payerUid = input.pioneerUid?.trim() || "pioneer_unverified";
  const merchantUid =
    input.merchantUid?.trim() ||
    process.env.PI_MERCHANT_UID?.trim() ||
    "bazaar_merchant";

  let paymentRecorded = false;
  let escrowUpdated = false;
  let ledgerRecorded = false;
  let auditRecorded = false;

  if (prisma?.payment?.upsert && input.pioneerUid?.trim()) {
    try {
      await prisma.payment.upsert({
        where: { paymentId: input.paymentId },
        update: {
          txid: input.txid,
          amount: numericAmount > 0 ? numericAmount : undefined,
          status: "COMPLETED",
        },
        create: {
          paymentId: input.paymentId,
          txid: input.txid,
          payerUid,
          merchantUid,
          amount: numericAmount,
          status: "COMPLETED",
        },
      });
      paymentRecorded = true;
    } catch (err) {
      console.warn("[SETTLEMENT_HOOK] Payment upsert skipped/failed:", err);
    }
  }

  if (input.escrowId && prisma?.escrowLock?.updateMany) {
    try {
      await prisma.escrowLock.updateMany({
        where: { escrowId: input.escrowId },
        data: {
          paymentId: input.paymentId,
          txid: input.txid,
        },
      });
      escrowUpdated = true;
    } catch (err) {
      console.warn("[SETTLEMENT_HOOK] EscrowLock update skipped/failed:", err);
    }
  }

  if (prisma?.meshLedger?.findFirst && prisma?.meshLedger?.create) {
    try {
      const existing = await prisma.meshLedger.findFirst({
        where: {
          OR: [{ txSignature: input.txid }, { txHash: input.txid }],
        },
      });

      if (!existing) {
        await prisma.meshLedger.create({
          data: {
            txSignature: input.txid,
            txHash: input.txid,
            txType: "SERVICE_SETTLEMENT",
            fromUid: input.pioneerUid?.trim() || null,
            toUid: merchantUid,
            piAmount: numericAmount,
            amount: numericAmount,
            status: "CONFIRMED",
            description: `[${input.realm}/${input.network}] Pi payment ${input.paymentId} settled`,
          },
        });
      }
      ledgerRecorded = true;
    } catch (err) {
      console.warn("[SETTLEMENT_HOOK] MeshLedger write skipped/failed:", err);
    }
  }

  if (prisma?.auditLog?.create) {
    try {
      await prisma.auditLog.create({
        data: {
          action: "PI_PAYMENT_SETTLED",
          nodeId: input.pioneerUid?.trim() || input.realm,
          payload: JSON.stringify({
            paymentId: input.paymentId,
            txid: input.txid,
            network: input.network,
            realm: input.realm,
            escrowId: input.escrowId ?? null,
            amount: numericAmount,
          }),
        },
      });
      auditRecorded = true;
    } catch (err) {
      console.warn("[SETTLEMENT_HOOK] AuditLog write skipped/failed:", err);
    }
  }

  return {
    settledAt: new Date().toISOString(),
    paymentId: input.paymentId,
    txid: input.txid,
    network: input.network,
    realm: input.realm,
    escrowId: input.escrowId ?? null,
    persistence: {
      paymentRecorded,
      escrowUpdated,
      ledgerRecorded,
      auditRecorded,
    },
  };
}