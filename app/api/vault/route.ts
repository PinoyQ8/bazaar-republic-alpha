import { NextRequest, NextResponse } from "next/server";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import {
  bazaarVaultService,
  BAZAAR_VAULT_CONTRACT_ID,
} from "@/services/bazaarVaultService";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidAddress(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return (
    StrKey.isValidEd25519PublicKey(trimmed) ||
    StrKey.isValidContract(trimmed)
  );
}

function resolveServerSigner(): Keypair | null {
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

function parsePositiveAmount(raw: unknown): bigint | string | number | null {
  if (typeof raw === "bigint") {
    return raw > 0n ? raw : null;
  }
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      const bi = BigInt(trimmed);
      return bi > 0n ? bi : null;
    }
    const num = Number(trimmed);
    return Number.isFinite(num) && num > 0 ? trimmed : null;
  }
  return null;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, OPTIONS",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-pioneer-uid",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawId = (
      searchParams.get("escrowId") ||
      searchParams.get("id") ||
      "MBZR_ESCROW_CANARY_01"
    ).trim();

    let targetEscrowId = rawId;
    const db = prisma as any;

    if (/^[0-9a-fA-F]{24}$/.test(rawId) && db?.escrowLock) {
      const dbRecord = await db.escrowLock
        .findUnique({ where: { id: rawId } })
        .catch(() => null);

      if (dbRecord?.escrowId) {
        targetEscrowId = dbRecord.escrowId;
      }
    }

    const vault: any = await bazaarVaultService.getVault(targetEscrowId);

    if (vault) {
      return NextResponse.json(
        {
          found: true,
          source: "ON_CHAIN",
          escrowId: targetEscrowId,
          contractId: BAZAAR_VAULT_CONTRACT_ID,
          vault: {
            ...vault,
            amount: vault.amount ? vault.amount.toString() : "0",
            expires_at: vault.expires_at ? vault.expires_at.toString() : null,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        found: false,
        escrowId: targetEscrowId,
        error: `Escrow '${targetEscrowId}' not found on ledger.`,
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("[API_VAULT_GET_ERROR]:", error);
    return NextResponse.json(
      { found: false, error: error?.message || "Failed to query vault ledger" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload in request body." },
        { status: 400 }
      );
    }

    const {
      action,
      escrowId,
      consumerAddress,
      providerAddress,
      amount,
      durationSecs,
      pioneerUid,
      secretKey,
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

    const normalizedAction = String(action || "").trim().toUpperCase();
    const normalizedEscrowId = String(escrowId || "").trim().replace(/-/g, "_");

    if (!normalizedAction || !normalizedEscrowId) {
      return NextResponse.json(
        { success: false, error: "Missing action or escrowId." },
        { status: 400 }
      );
    }

    const signer = resolveServerSigner();
    if (!signer) {
      return NextResponse.json(
        {
          success: false,
          error: "Server Ed25519 signing key is not configured.",
        },
        { status: 503 }
      );
    }

    const db = prisma as any;
    const callerUid = String(
      pioneerUid || req.headers.get("x-pioneer-uid") || ""
    ).trim();

    // Check freeze/sanction status if pioneerNode exists for callerUid or consumerAddress
    if (db?.pioneerNode) {
      const node = await db.pioneerNode
        .findFirst({
          where: {
            OR: [
              ...(callerUid ? [{ uid: callerUid }] : []),
              ...(isValidAddress(consumerAddress)
                ? [{ walletAddress: consumerAddress.trim() }]
                : []),
            ],
          },
        })
        .catch(() => null);

      const nodeStatus = String(node?.status || "").toUpperCase();
      if (
        node?.isFrozen ||
        nodeStatus === "FROZEN" ||
        nodeStatus === "SUSPENDED"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Account/node status is ${nodeStatus || "FROZEN"}. Vault mutations are blocked.`,
          },
          { status: 403 }
        );
      }
    }

    const dbEscrow = db?.escrowLock
      ? await db.escrowLock
          .findFirst({
            where: {
              OR: [
                { escrowId: normalizedEscrowId },
                { escrowId: String(escrowId).trim() },
              ],
            },
          })
          .catch(() => null)
      : null;

    let txResponse: any;

    switch (normalizedAction) {
      case "LOCK": {
        if (
          !isValidAddress(consumerAddress) ||
          !isValidAddress(providerAddress)
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Valid Stellar/Soroban consumerAddress and providerAddress are required for LOCK.",
            },
            { status: 400 }
          );
        }

        if (consumerAddress.trim() === providerAddress.trim()) {
          return NextResponse.json(
            {
              success: false,
              error: "consumerAddress and providerAddress must be distinct.",
            },
            { status: 400 }
          );
        }

        const validAmount = parsePositiveAmount(amount);
        if (validAmount === null) {
          return NextResponse.json(
            {
              success: false,
              error: "LOCK amount must be a finite positive value (> 0).",
            },
            { status: 400 }
          );
        }

        txResponse = await bazaarVaultService.lockFunds(
          {
            escrowId: normalizedEscrowId,
            consumerAddress: consumerAddress.trim(),
            providerAddress: providerAddress.trim(),
            amount: validAmount,
            ...(durationSecs !== undefined ? { durationSecs } : {}),
          },
          signer
        );

        const txHash = String(txResponse?.hash || "").trim();
        if (!txHash) {
          throw new Error("On-chain LOCK succeeded without a transaction hash.");
        }

        if (db?.escrowLock && dbEscrow?.id) {
          await db.escrowLock
            .update({
              where: { id: dbEscrow.id },
              data: { status: "LOCKED", txHash, updatedAt: new Date() },
            })
            .catch(() => null);
        }

        return NextResponse.json(
          { success: true, txHash, status: "LOCKED", result: txResponse },
          { status: 200 }
        );
      }

      case "RELEASE":
      case "REFUND": {
        if (consumerAddress && !isValidAddress(consumerAddress)) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid consumerAddress format.",
            },
            { status: 400 }
          );
        }

        const dbStatus = String(dbEscrow?.status || "").toUpperCase();
        if (
          dbStatus &&
          ["RELEASED", "REFUNDED", "DISPUTED"].includes(dbStatus)
        ) {
          return NextResponse.json(
            {
              success: false,
              error: `Escrow '${normalizedEscrowId}' cannot be ${normalizedAction.toLowerCase()}d while in status '${dbStatus}'.`,
            },
            { status: 409 }
          );
        }

        const liveVault = await bazaarVaultService.getVault(normalizedEscrowId);
        if (!liveVault) {
          return NextResponse.json(
            {
              success: false,
              error: `Escrow '${normalizedEscrowId}' not found on-chain.`,
            },
            { status: 404 }
          );
        }

        const onChainStatus = String(liveVault.status || "").toUpperCase();
        if (onChainStatus !== "LOCKED") {
          return NextResponse.json(
            {
              success: false,
              error: `Escrow '${normalizedEscrowId}' is in on-chain status '${liveVault.status}' (expected Locked).`,
            },
            { status: 409 }
          );
        }

        const expectedConsumer = String(
          liveVault.consumer || dbEscrow?.consumerAddress || ""
        ).trim();
        const requestedCaller = String(
          consumerAddress || expectedConsumer || signer.publicKey()
        ).trim();

        if (
          expectedConsumer &&
          isValidAddress(expectedConsumer) &&
          requestedCaller !== expectedConsumer &&
          requestedCaller !== signer.publicKey()
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Caller address is not authorized to mutate this escrow.",
            },
            { status: 403 }
          );
        }

        txResponse =
          normalizedAction === "RELEASE"
            ? await bazaarVaultService.releaseFunds(
                normalizedEscrowId,
                requestedCaller,
                signer
              )
            : await bazaarVaultService.refundFunds(
                normalizedEscrowId,
                requestedCaller,
                signer
              );

        const txHash = String(txResponse?.hash || "").trim();
        if (!txHash) {
          throw new Error(
            `On-chain ${normalizedAction} succeeded without a transaction hash.`
          );
        }

        const nextDbStatus =
          normalizedAction === "RELEASE" ? "RELEASED" : "REFUNDED";

        if (db?.escrowLock && dbEscrow?.id) {
          await db.escrowLock
            .update({
              where: { id: dbEscrow.id },
              data: { status: nextDbStatus, txHash, updatedAt: new Date() },
            })
            .catch(() => null);
        }

        return NextResponse.json(
          {
            success: true,
            txHash,
            status: nextDbStatus,
            result: txResponse,
          },
          { status: 200 }
        );
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported vault action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("[API_VAULT_POST_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Vault transaction failed" },
      { status: 500 }
    );
  }
}