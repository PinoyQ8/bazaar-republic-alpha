import { NextRequest, NextResponse } from "next/server";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { prisma } from "@/lib/prisma";
import {
  BazaarVaultService,
  BAZAAR_VAULT_CONTRACT_ID,
} from "@/services/bazaarVaultService";

export const dynamic = "force-dynamic";

const PI_TO_MBZR = 1000;
const STROOPS_PER_PI = 10_000_000;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const DEFAULT_CONSUMER_ADDRESS =
  "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3";
const DEFAULT_PROVIDER_ADDRESS =
  "GA7UMIANNCXSZK5NQ7GCAWL3BP3GOBGVRHLSRYY5WI2KZG4SRFLZSARW";
const DEFAULT_ADMIN_ADDRESS =
  process.env.BAZAAR_VAULT_ADMIN_ADDRESS ||
  process.env.NEXT_PUBLIC_STELLAR_ADMIN_ADDRESS ||
  DEFAULT_CONSUMER_ADDRESS;

function isHexObjectId(value: unknown): value is string {
  return typeof value === "string" && OBJECT_ID_REGEX.test(value.trim());
}

function resolveSignerKeypair(secretKeyOverride?: unknown): Keypair | null {
  const rawSecret = String(
    secretKeyOverride ||
      process.env.STELLAR_DEPLOYER_SECRET ||
      process.env.OPERATOR_STELLAR_SECRET ||
      process.env.STELLAR_VAULT_SEED ||
      ""
  )
    .replace(/["'\r\n]/g, "")
    .trim();

  if (!rawSecret || !StrKey.isValidEd25519SecretSeed(rawSecret)) {
    return null;
  }
  return Keypair.fromSecret(rawSecret);
}

function resolveRuling(
  ruling: unknown,
  votesForConsumer: number,
  votesForMerchant: number
): "FAVOR_CONSUMER" | "FAVOR_MERCHANT" {
  const normalized = String(ruling || "")
    .trim()
    .toUpperCase();

  if (
    normalized === "FAVOR_CONSUMER" ||
    normalized === "REFUND_CONSUMER" ||
    normalized === "CONSUMER" ||
    normalized === "REFUND"
  ) {
    return "FAVOR_CONSUMER";
  }

  if (
    normalized === "FAVOR_MERCHANT" ||
    normalized === "RELEASE_MERCHANT" ||
    normalized === "MERCHANT" ||
    normalized === "RELEASE"
  ) {
    return "FAVOR_MERCHANT";
  }

  return votesForMerchant > votesForConsumer
    ? "FAVOR_MERCHANT"
    : "FAVOR_CONSUMER";
}

function toStroopsBigInt(escrow: any, escrowAmountPi: number): bigint {
  if (escrow?.amountStroops !== undefined && escrow?.amountStroops !== null) {
    return BigInt(escrow.amountStroops);
  }
  const num = Number(escrowAmountPi ?? 0);
  if (Number.isInteger(num) && num >= STROOPS_PER_PI) {
    return BigInt(num);
  }
  return BigInt(Math.round(num * STROOPS_PER_PI));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      disputeId,
      escrowId,
      ruling,
      adminAddress,
      payoutToAddress,
      amountStroops: bodyAmountStroops,
      contractId: bodyContractId,
      secretKey,
      nonce,
      skipOnChain = false,
      enforceQuorum = false,
    } = body || {};

    const targetKey = String(disputeId || escrowId || "").trim();
    if (!targetKey) {
      return NextResponse.json(
        { success: false, error: "Missing disputeId or escrowId" },
        { status: 400 }
      );
    }

    const db = prisma as any;
    const targetIsObjectId = isHexObjectId(targetKey);

    let dispute: any = null;
    if (db?.disputeRecord) {
      if (targetIsObjectId) {
        dispute = await db.disputeRecord
          .findUnique({ where: { id: targetKey } })
          .catch(() => null);
      }
      if (!dispute) {
        const disputeOrClauses: any[] = [{ escrowId: targetKey }];
        if (targetIsObjectId) {
          disputeOrClauses.push({ id: targetKey }, { escrowLockId: targetKey });
        }
        dispute = await db.disputeRecord
          .findFirst({ where: { OR: disputeOrClauses } })
          .catch(() => null);
      }
    }

    const resolvedEscrowId = String(
      escrowId || dispute?.escrowId || targetKey
    ).trim();

    let escrow: any = null;
    if (db?.escrowLock) {
      if (targetIsObjectId) {
        escrow = await db.escrowLock
          .findUnique({ where: { id: targetKey } })
          .catch(() => null);
      }
      if (!escrow) {
        const escrowOrClauses: any[] = [{ escrowId: resolvedEscrowId }];
        if (targetIsObjectId) {
          escrowOrClauses.push({ id: targetKey });
        }
        if (isHexObjectId(dispute?.escrowLockId)) {
          escrowOrClauses.push({ id: dispute.escrowLockId });
        }
        escrow = await db.escrowLock
          .findFirst({ where: { OR: escrowOrClauses } })
          .catch(() => null);
      }
    }

    const targetContractId = String(
      bodyContractId || escrow?.vaultContractId || BAZAAR_VAULT_CONTRACT_ID
    ).trim();
    const vaultSvc = new BazaarVaultService(targetContractId);
    const liveVault = await vaultSvc
      .getVault(resolvedEscrowId)
      .catch(() => null);

    const votesForConsumer = Number(dispute?.votesForConsumer ?? 0);
    const votesForMerchant = Number(dispute?.votesForMerchant ?? 0);
    const finalRuling = resolveRuling(ruling, votesForConsumer, votesForMerchant);

    if (enforceQuorum) {
      const majorityVotes =
        finalRuling === "FAVOR_CONSUMER" ? votesForConsumer : votesForMerchant;
      if (majorityVotes < 3) {
        return NextResponse.json(
          {
            success: false,
            code: "VOTE_RECORDED_PENDING_QUORUM",
            error: `3-of-5 Elder quorum not met for ${finalRuling} (received ${majorityVotes} votes; ${3 - majorityVotes} more needed).`,
          },
          { status: 202 }
        );
      }
    }

    const consumerAddr =
      liveVault?.consumer ||
      escrow?.consumerAddress ||
      escrow?.consumer ||
      escrow?.consumerUid ||
      DEFAULT_CONSUMER_ADDRESS;
    const providerAddr =
      liveVault?.provider ||
      escrow?.providerAddress ||
      escrow?.provider ||
      escrow?.providerId ||
      DEFAULT_PROVIDER_ADDRESS;

    const finalPayoutTo =
      String(payoutToAddress || "").trim() ||
      (finalRuling === "FAVOR_CONSUMER" ? consumerAddr : providerAddr);
    const finalAdmin =
      String(adminAddress || "").trim() || DEFAULT_ADMIN_ADDRESS;

    const amountStroops =
      bodyAmountStroops !== undefined && bodyAmountStroops !== null
        ? BigInt(bodyAmountStroops)
        : liveVault?.amount !== undefined && liveVault?.amount !== null
          ? BigInt(liveVault.amount)
          : toStroopsBigInt(escrow, Number(escrow?.amount ?? 0.01));

    const escrowAmountPi = Number(amountStroops) / STROOPS_PER_PI;
    const nextNonce = BigInt(
      nonce ??
        (dispute?.pqNonce !== undefined && dispute?.pqNonce !== null
          ? Number(dispute.pqNonce) + 1
          : 1)
    );

    const signer = resolveSignerKeypair(secretKey);
    let settlementMode: "ON_CHAIN_PQ" | "LEDGER_ONLY" = "LEDGER_ONLY";
    let txHash: string | null = null;
    let onChainWarning: string | null = null;

    if (!skipOnChain && signer) {
      try {
        const vaultTx = await vaultSvc.resolveDisputeWithPq(
          {
            contractId: targetContractId,
            escrowId: resolvedEscrowId,
            adminAddress: finalAdmin,
            payoutToAddress: finalPayoutTo,
            amountStroops,
            nonce: nextNonce,
          },
          signer
        );
        settlementMode = "ON_CHAIN_PQ";
        txHash = vaultTx.hash;
      } catch (chainErr: any) {
        onChainWarning = chainErr?.message || String(chainErr);
        console.warn(
          "[API_DISPUTE_RESOLVE_PQ_FALLBACK_LEDGER]:",
          onChainWarning
        );
      }
    } else if (!skipOnChain && !signer) {
      onChainWarning =
        "No valid Ed25519 signer secret found; settled in LEDGER_ONLY mode.";
    }

    const consumerWon = finalRuling === "FAVOR_CONSUMER";
    const escrowStatus = consumerWon ? "REFUNDED" : "RELEASED";
    const winningOutcome = consumerWon
      ? "RESOLVED_CONSUMER"
      : "RESOLVED_MERCHANT";

    const loserBond = Number(dispute?.bondAmount ?? 5000);
    const winnerCompensationMbzr = loserBond * 0.75;
    const elderPoolTotalMbzr = loserBond * 0.25;
    const majorityElderCount = Math.max(
      consumerWon ? votesForConsumer : votesForMerchant,
      1
    );
    const rewardPerElderMbzr = elderPoolTotalMbzr / majorityElderCount;
    const principalMbzr = escrowAmountPi * PI_TO_MBZR;
    const totalWinnerCreditMbzr = principalMbzr + winnerCompensationMbzr;

    if (db?.disputeRecord && dispute?.id) {
      await db.disputeRecord
        .update({
          where: { id: dispute.id },
          data: {
            status: winningOutcome,
            pqNonce: Number(nextNonce),
            ...(txHash ? { resolutionTxHash: txHash } : {}),
            updatedAt: new Date(),
          },
        })
        .catch(() => null);
    }

    if (db?.escrowLock && escrow?.id) {
      await db.escrowLock
        .update({
          where: { id: escrow.id },
          data: {
            status: escrowStatus,
            ...(txHash ? { txHash } : {}),
            updatedAt: new Date(),
          },
        })
        .catch(() => null);
    }

    if (db?.pioneerNode) {
      const winnerUid = consumerWon
        ? escrow?.consumerUid || consumerAddr
        : escrow?.providerId || providerAddr;

      if (winnerUid) {
        await db.pioneerNode
          .updateMany({
            where: { uid: winnerUid },
            data: { mbzrBalance: { increment: totalWinnerCreditMbzr } },
          })
          .catch(() => null);
      }

      const elders = Array.isArray(dispute?.selectedElders)
        ? dispute.selectedElders
        : [];
      for (let i = 0; i < Math.min(majorityElderCount, elders.length); i++) {
        await db.pioneerNode
          .updateMany({
            where: { uid: elders[i] },
            data: { mbzrBalance: { increment: rewardPerElderMbzr } },
          })
          .catch(() => null);
      }
    }

    return NextResponse.json(
      {
        success: true,
        escrowId: resolvedEscrowId,
        ruling: finalRuling,
        winningOutcome,
        escrowStatus,
        settlementMode,
        txHash,
        ...(onChainWarning ? { onChainWarning } : {}),
        pqAuth: {
          nonce: nextNonce.toString(),
          amountStroops: amountStroops.toString(),
          payoutTo: finalPayoutTo,
        },
        settlementLedger: {
          principalMbzr,
          totalLoserBondMbzr: loserBond,
          winnerCompensationMbzr,
          totalWinnerCreditMbzr,
          elderPoolTotalMbzr,
          participatingMajorityElders: majorityElderCount,
          rewardPerElderMbzr,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[API_DISPUTE_RESOLVE_ERROR]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}