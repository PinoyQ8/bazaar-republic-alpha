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
const STROOPS_PER_PI_BIGINT = 10_000_000n;

const DEFAULT_CONSUMER_ADDRESS =
  "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3";
const DEFAULT_PROVIDER_ADDRESS =
  "GA7UMIANNCXSZK5NQ7GCAWL3BP3GOBGVRHLSRYY5WI2KZG4SRFLZSARW";
const DEFAULT_ADMIN_ADDRESS =
  process.env.BAZAAR_VAULT_ADMIN_ADDRESS ||
  process.env.NEXT_PUBLIC_STELLAR_ADMIN_ADDRESS ||
  DEFAULT_CONSUMER_ADDRESS;

function resolveServerSignerKeypair(): Keypair | null {
  const rawSecret = String(
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
  if (!Number.isFinite(num) || num <= 0) {
    return 0n;
  }
  if (Number.isInteger(num) && num >= STROOPS_PER_PI) {
    return BigInt(num);
  }
  return BigInt(Math.round(num * STROOPS_PER_PI));
}

function parsePositiveBigInt(raw: unknown, label: string): bigint {
  if (
    typeof raw === "number" &&
    (!Number.isFinite(raw) || !Number.isInteger(raw))
  ) {
    throw new Error(`${label} must be a finite integer.`);
  }
  const parsed = BigInt(raw as bigint | number | string);
  if (parsed <= 0n) {
    throw new Error(`${label} must be greater than 0.`);
  }
  return parsed;
}

function isNodeSanctionedOrFrozen(node: any): boolean {
  if (!node) return false;
  const status = String(node.status || "").toUpperCase();
  return Boolean(
    node.isFrozen || status === "FROZEN" || status === "SUSPENDED"
  );
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

    if (
      secretKey !== undefined &&
      secretKey !== null &&
      String(secretKey).trim() !== ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supplying raw secretKey in the HTTP request body is forbidden. Configure server signer env variables instead.",
        },
        { status: 400 }
      );
    }

    const targetKey = String(disputeId || escrowId || "").trim();
    if (!targetKey) {
      return NextResponse.json(
        { success: false, error: "Missing disputeId or escrowId" },
        { status: 400 }
      );
    }

    const db = prisma as any;
    const isHexBson = /^[0-9a-fA-F]{24}$/.test(targetKey);

    let dispute: any = null;
    if (db?.disputeRecord) {
      if (isHexBson) {
        dispute = await db.disputeRecord
          .findUnique({ where: { id: targetKey } })
          .catch(() => null);
      }
      if (!dispute) {
        dispute = await db.disputeRecord
          .findFirst({
            where: {
              OR: [
                ...(isHexBson ? [{ id: targetKey }] : []),
                { escrowId: targetKey },
                ...(isHexBson ? [{ escrowLockId: targetKey }] : []),
              ],
            },
          })
          .catch(() => null);
      }
    }

    const resolvedEscrowId = String(
      escrowId || dispute?.escrowId || targetKey
    ).trim();

    let escrow: any = null;
    if (db?.escrowLock) {
      if (isHexBson) {
        escrow = await db.escrowLock
          .findUnique({ where: { id: targetKey } })
          .catch(() => null);
      }
      if (!escrow) {
        escrow = await db.escrowLock
          .findFirst({
            where: {
              OR: [
                { escrowId: resolvedEscrowId },
                ...(dispute?.escrowLockId ? [{ id: dispute.escrowLockId }] : []),
              ],
            },
          })
          .catch(() => null);
      }
    }

    const targetContractId = String(
      bodyContractId || escrow?.vaultContractId || BAZAAR_VAULT_CONTRACT_ID
    ).trim();

    if (!StrKey.isValidContract(targetContractId)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid target contractId: ${targetContractId}`,
        },
        { status: 400 }
      );
    }

    const vaultSvc = new BazaarVaultService(targetContractId);
    const liveVault = await vaultSvc
      .getVault(resolvedEscrowId)
      .catch(() => null);

    // 1. Reject finalized or non-disputed escrow/dispute states
    const currentDisputeStatus = String(dispute?.status || "").toUpperCase();
    const onChainStatus = String(liveVault?.status || "").toUpperCase();
    const dbEscrowStatus = String(escrow?.status || "").toUpperCase();
    const finalizedStatuses = [
      "RELEASED",
      "REFUNDED",
      "RESOLVED_CONSUMER",
      "RESOLVED_MERCHANT",
    ];

    if (
      finalizedStatuses.includes(currentDisputeStatus) ||
      finalizedStatuses.includes(onChainStatus) ||
      finalizedStatuses.includes(dbEscrowStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Escrow '${resolvedEscrowId}' is already finalized (onChain=${onChainStatus || "N/A"}, db=${dbEscrowStatus || "N/A"}, dispute=${currentDisputeStatus || "N/A"}).`,
        },
        { status: 409 }
      );
    }

    if (!skipOnChain && liveVault && onChainStatus !== "DISPUTED") {
      return NextResponse.json(
        {
          success: false,
          error: `On-chain escrow '${resolvedEscrowId}' is in status '${liveVault.status}' (must be DISPUTED for PQ dispute resolution).`,
        },
        { status: 409 }
      );
    }

    if (dbEscrowStatus && !["DISPUTED", "LOCKED"].includes(dbEscrowStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Database escrow '${resolvedEscrowId}' is in non-resolvable status '${dbEscrowStatus}' (expected DISPUTED or LOCKED).`,
        },
        { status: 409 }
      );
    }

    const votesForConsumer = Number(dispute?.votesForConsumer ?? 0);
    const votesForMerchant = Number(dispute?.votesForMerchant ?? 0);
    const finalRuling = resolveRuling(
      ruling,
      votesForConsumer,
      votesForMerchant
    );

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

    const consumerWon = finalRuling === "FAVOR_CONSUMER";
    const expectedRulingRecipient = consumerWon ? consumerAddr : providerAddr;
    const finalPayoutTo =
      String(payoutToAddress || "").trim() || expectedRulingRecipient;
    const finalAdmin =
      String(adminAddress || "").trim() || DEFAULT_ADMIN_ADDRESS;

    if (!StrKey.isValidEd25519PublicKey(finalAdmin)) {
      return NextResponse.json(
        { success: false, error: "Invalid adminAddress Stellar public key." },
        { status: 400 }
      );
    }

    if (!StrKey.isValidEd25519PublicKey(finalPayoutTo)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payoutToAddress Stellar public key.",
        },
        { status: 400 }
      );
    }

    if (
      StrKey.isValidEd25519PublicKey(expectedRulingRecipient) &&
      finalPayoutTo !== expectedRulingRecipient
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `payoutToAddress (${finalPayoutTo}) does not match expected ${finalRuling} recipient (${expectedRulingRecipient}).`,
        },
        { status: 400 }
      );
    }

    // 2. Sanction / Freeze guard on payout recipient before executing settlement
    const winnerUid = consumerWon
      ? escrow?.consumerUid || consumerAddr
      : escrow?.providerId || providerAddr;

    if (db?.pioneerNode) {
      const winnerNode = await db.pioneerNode
        .findFirst({
          where: {
            OR: [
              ...(winnerUid ? [{ uid: winnerUid }] : []),
              { walletAddress: finalPayoutTo },
            ],
          },
        })
        .catch(() => null);

      if (isNodeSanctionedOrFrozen(winnerNode)) {
        const blockedStatus = String(winnerNode?.status || "FROZEN").toUpperCase();
        return NextResponse.json(
          {
            success: false,
            error: `Settlement blocked: payout recipient node (${winnerUid || finalPayoutTo}) is ${blockedStatus}.`,
          },
          { status: 403 }
        );
      }
    }

    let amountStroops: bigint;
    try {
      amountStroops =
        bodyAmountStroops !== undefined && bodyAmountStroops !== null
          ? parsePositiveBigInt(bodyAmountStroops, "amountStroops")
          : liveVault?.amount !== undefined && liveVault?.amount !== null
            ? parsePositiveBigInt(liveVault.amount, "liveVault.amount")
            : parsePositiveBigInt(
                toStroopsBigInt(escrow, Number(escrow?.amount ?? 0.01)),
                "escrow amount"
              );
    } catch (amountErr: any) {
      return NextResponse.json(
        {
          success: false,
          error:
            amountErr?.message || "Escrow amountStroops must be greater than 0.",
        },
        { status: 400 }
      );
    }

    if (
      liveVault?.amount !== undefined &&
      liveVault?.amount !== null &&
      BigInt(liveVault.amount) > 0n &&
      amountStroops !== BigInt(liveVault.amount)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `amountStroops (${amountStroops}) does not match live on-chain vault amount (${liveVault.amount}).`,
        },
        { status: 400 }
      );
    }

    const escrowAmountPi =
      Number(amountStroops / STROOPS_PER_PI_BIGINT) +
      Number(amountStroops % STROOPS_PER_PI_BIGINT) / STROOPS_PER_PI;

    let nextNonce: bigint;
    try {
      const rawNonce =
        nonce !== undefined && nonce !== null && String(nonce).trim() !== ""
          ? nonce
          : dispute?.pqNonce !== undefined && dispute?.pqNonce !== null
            ? Number(dispute.pqNonce) + 1
            : 1;
      nextNonce = parsePositiveBigInt(rawNonce, "nonce");
    } catch (nonceErr: any) {
      return NextResponse.json(
        { success: false, error: nonceErr?.message || "Invalid PQ nonce." },
        { status: 400 }
      );
    }

    if (
      dispute?.pqNonce !== undefined &&
      dispute?.pqNonce !== null &&
      nextNonce <= BigInt(dispute.pqNonce)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Nonce (${nextNonce}) must be greater than last recorded dispute pqNonce (${dispute.pqNonce}).`,
        },
        { status: 409 }
      );
    }

    const signer = resolveServerSignerKeypair();
    let settlementMode: "ON_CHAIN_PQ" | "LEDGER_ONLY" = "LEDGER_ONLY";
    let txHash: string | null = null;

    if (!skipOnChain) {
      if (!signer) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Server Ed25519 signer secret is not configured; refusing silent LEDGER_ONLY fallback while skipOnChain is false.",
          },
          { status: 503 }
        );
      }

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
        const chainMessage = chainErr?.message || String(chainErr);
        console.error("[API_DISPUTE_RESOLVE_PQ_FAILED]:", chainMessage);
        return NextResponse.json(
          {
            success: false,
            error: `On-chain PQ dispute resolution failed: ${chainMessage}`,
          },
          { status: 502 }
        );
      }
    }

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
        const elderUid = elders[i];
        const elderNode = await db.pioneerNode
          .findFirst({ where: { uid: elderUid } })
          .catch(() => null);

        if (isNodeSanctionedOrFrozen(elderNode)) {
          continue;
        }

        await db.pioneerNode
          .updateMany({
            where: { uid: elderUid },
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