import { NextRequest, NextResponse } from "next/server";
import {
  bazaarVaultService,
  BAZAAR_VAULT_CONTRACT_ID,
  SAC_TOKEN_CONTRACT,
} from "@/services/bazaarVaultService";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toUnixSeconds(val: unknown): string {
  if (!val) return "0";
  if (typeof val === "object" && val !== null && "$date" in val) {
    const ms = new Date((val as { $date: string | number }).$date).getTime();
    return Number.isFinite(ms) ? Math.floor(ms / 1000).toString() : "0";
  }
  const ms = new Date(val as string | number | Date).getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 1000).toString() : "0";
}

function normalizeStatus(rawStatus: unknown): "Locked" | "Released" | "Refunded" | "Disputed" {
  const upper = String(rawStatus || "LOCKED").toUpperCase();
  if (upper === "RELEASED") return "Released";
  if (upper === "REFUNDED") return "Refunded";
  if (upper === "DISPUTED") return "Disputed";
  return "Locked";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawId = (searchParams.get("escrowId") || searchParams.get("id") || "").trim();

    if (!rawId) {
      return NextResponse.json(
        { found: false, error: "Missing escrowId parameter" },
        { status: 400 }
      );
    }

    const db = prisma as any;
    let targetEscrowId = rawId;

    // 1. Resolve MongoDB ObjectId to canonical escrowId if provided
    if (/^[0-9a-fA-F]{24}$/.test(rawId) && typeof db?.$runCommandRaw === "function") {
      const hexRes: any = await db
        .$runCommandRaw({
          aggregate: "EscrowLock",
          pipeline: [
            { $match: { _id: { $oid: rawId } } },
            { $project: { _id: 1, escrowId: 1 } },
          ],
          cursor: {},
        })
        .catch(() => null);

      const matched = hexRes?.cursor?.firstBatch?.[0];
      if (typeof matched?.escrowId === "string" && matched.escrowId.trim()) {
        targetEscrowId = matched.escrowId.trim();
      }
    }

    // 2. Query On-Chain Soroban Ledger
    try {
      const onChainVault: any = await bazaarVaultService.getVault(targetEscrowId);
      if (onChainVault) {
        return NextResponse.json(
          {
            found: true,
            source: "ON_CHAIN",
            escrowId: targetEscrowId,
            contractId: BAZAAR_VAULT_CONTRACT_ID,
            vault: {
              ...onChainVault,
              amount: onChainVault.amount ? onChainVault.amount.toString() : "0",
              expires_at: onChainVault.expires_at
                ? onChainVault.expires_at.toString()
                : null,
            },
          },
          { status: 200 }
        );
      }
    } catch {
      // Storage miss falls through to local database fallback
    }

    // 3. Raw BSON Database Fallback
    const rawDbRes: any =
      typeof db?.$runCommandRaw === "function"
        ? await db
            .$runCommandRaw({
              aggregate: "EscrowLock",
              pipeline: [
                {
                  $match: {
                    $or: [
                      { escrowId: targetEscrowId },
                      { escrowId: rawId },
                      { txid: rawId },
                      { paymentId: rawId },
                    ],
                  },
                },
                { $limit: 1 },
              ],
              cursor: {},
            })
            .catch(() => null)
        : null;

    const doc = rawDbRes?.cursor?.firstBatch?.[0];

    if (doc) {
      const amountPi = Number(doc.amount ?? doc.amountPi ?? 0);
      const safeAmountPi = Number.isFinite(amountPi) ? amountPi : 0;
      const stroops = Math.round(safeAmountPi * 10_000_000).toString();

      let parsedProvider = "usr_provider";
      if (typeof doc.providerId === "string" && doc.providerId.trim().length > 0) {
        parsedProvider = doc.providerId.trim();
      } else if (typeof doc.providerId === "object" && doc.providerId !== null) {
        parsedProvider =
          doc.providerId.$oid ||
          doc.providerId._id ||
          doc.providerId.businessName ||
          "usr_provider";
      }

      return NextResponse.json(
        {
          found: true,
          source: "DATABASE_SYNCED",
          escrowId: doc.escrowId || targetEscrowId,
          contractId: BAZAAR_VAULT_CONTRACT_ID,
          vault: {
            consumer: doc.consumerUid || "usr_pioneer",
            provider: parsedProvider,
            amount: stroops,
            status: normalizeStatus(doc.status),
            protocol_version: 28,
            token_contract:
              SAC_TOKEN_CONTRACT ||
              "CDG6ZM2SHXIHD5HZ2E62B7D76RY5DUHDNQVPSHRVDNN7W4EW47FXLEXQ",
            expires_at: toUnixSeconds(doc.timelockExpiresAt ?? doc.expiresAt),
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        found: false,
        escrowId: targetEscrowId,
        error: `Escrow '${targetEscrowId}' not found on ledger or database.`,
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("[API_VAULT_FATAL]:", error);
    return NextResponse.json(
      { found: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}