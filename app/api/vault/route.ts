import { NextRequest, NextResponse } from "next/server";
import { bazaarVaultService, SAC_TOKEN_CONTRACT } from "@/services/bazaarVaultService";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawId = (searchParams.get("escrowId") || searchParams.get("id") || "").trim();

    if (!rawId) {
      return NextResponse.json({ found: false, error: "Missing escrowId parameter" }, { status: 400 });
    }

    const db = prisma as any;
    let targetEscrowId = rawId;

    // 1. Resolve MongoDB ObjectId to canonical escrowId if provided
    if (/^[0-9a-fA-F]{24}$/.test(rawId)) {
      const hexRes: any = await db.$runCommandRaw({
        aggregate: "EscrowLock",
        pipeline: [
          { $match: { _id: {$oid: rawId } } },
          { $project: { _id: 1, escrowId: 1 } }
        ],
        cursor: {}
      }).catch(() => null);

      const matched = hexRes?.cursor?.firstBatch?.[0];
      if (matched?.escrowId) {
        targetEscrowId = matched.escrowId;
      }
    }

    // 2. Query On-Chain Soroban Ledger
    try {
      const onChainVault = await bazaarVaultService.getVault(targetEscrowId);
      if (onChainVault) {
        return NextResponse.json({
          found: true,
          source: "ON_CHAIN",
          escrowId: targetEscrowId,
          vault: {
            ...onChainVault,
            amount: onChainVault.amount ? onChainVault.amount.toString() : "0",
            expires_at: onChainVault.expires_at ? onChainVault.expires_at.toString() : null
          }
        }, { status: 200 });
      }
    } catch {
      // Storage miss falls through to local database fallback
    }

    // 3. Raw BSON Database Fallback
    const rawDbRes: any = await db.$runCommandRaw({
      aggregate: "EscrowLock",
      pipeline: [
        {
          $match: {$or: [
              { escrowId: targetEscrowId },
              { escrowId: rawId },
              { txid: rawId },
              { paymentId: rawId }
            ]
          }
        },
        { $limit: 1 }
      ],
      cursor: {}
    }).catch(() => null);

    const doc = rawDbRes?.cursor?.firstBatch?.[0];

    if (doc) {
      const amountPi = Number(doc.amount || 0);
      const stroops = Math.round(amountPi * 10_000_000).toString();

      let parsedProvider = "usr_provider";
      if (typeof doc.providerId === "string" && doc.providerId.trim().length > 0) {
        parsedProvider = doc.providerId;
      } else if (typeof doc.providerId === "object" && doc.providerId !== null) {
        parsedProvider = doc.providerId.$oid || doc.providerId._id || doc.providerId.businessName || "usr_provider";
      }

      return NextResponse.json({
        found: true,
        source: "DATABASE_SYNCED",
        escrowId: doc.escrowId,
        vault: {
          consumer: doc.consumerUid || "usr_pioneer",
          provider: parsedProvider,
          amount: stroops,
          status: doc.status === "RELEASED" ? "Released" : doc.status === "REFUNDED" ? "Refunded" : "Locked",
          protocol_version: 28,
          token_contract: SAC_TOKEN_CONTRACT || "CDG6ZM2SHXIHD5HZ2E62B7D76RY5DUHDNQVPSHRVDNN7W4EW47FXLEXQ",
          expires_at: doc.timelockExpiresAt?.$date 
            ? Math.floor(new Date(doc.timelockExpiresAt.$date).getTime() / 1000).toString() 
            : "0"
        }
      }, { status: 200 });
    }

    return NextResponse.json({
      found: false,
      escrowId: targetEscrowId,
      error: `Escrow '${targetEscrowId}' not found on ledger or database.`
    }, { status: 404 });

  } catch (error: any) {
    console.error("[API_VAULT_FATAL]:", error);
    return NextResponse.json({ found: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
