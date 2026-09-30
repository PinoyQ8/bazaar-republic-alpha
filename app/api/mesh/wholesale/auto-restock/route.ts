import { NextRequest, NextResponse } from "next/server";
import { Keypair } from "@stellar/stellar-sdk";
import { prisma } from "@/lib/prisma";
import {
  bazaarVaultService,
  BAZAAR_VAULT_CONTRACT_ID,
  SAC_TOKEN_CONTRACT,
} from "@/services/bazaarVaultService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PROTOCOL_EXIT_TARIFF_BPS = 50; // 0.5% Wholesale Melt Tariff

function safeJson(data: any, status = 200) {
  const sanitized = JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );
  return NextResponse.json(sanitized, { status });
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return safeJson({ success: false, error: "Invalid JSON payload received." }, 400);
    }

    const {
      retailerUid,
      supplierAddress,
      sku,
      quantity,
      totalPiAmount,
      channelTicketId,
      passkeyAssertion,
    } = body || {};

    if (!retailerUid || !supplierAddress || !sku || !totalPiAmount || totalPiAmount <= 0) {
      return safeJson(
        { success: false, error: "Missing retailerUid, supplierAddress, sku, or valid totalPiAmount." },
        400
      );
    }

    if (!passkeyAssertion?.credentialId || !passkeyAssertion?.signature) {
      return safeJson(
        { success: false, error: "BIOMETRIC_REJECTED: Valid hardware passkey signature required." },
        401
      );
    }

    const requestedPi = Number(totalPiAmount);
    const exitTariffPi = (requestedPi * PROTOCOL_EXIT_TARIFF_BPS) / 10000;
    const netSupplierPi = requestedPi - exitTariffPi;

    const amountStroops = BigInt(Math.round(netSupplierPi * 10_000_000));
    const durationSecs = BigInt(72 * 3600);

    const sanitizedSku = sku.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    const escrowId = `ESC_W_${sanitizedSku}_${Date.now().toString(36)}`.slice(0, 32);

    const activeSecret =
      process.env.STELLAR_DEPLOYER_SECRET ||
      process.env.STELLAR_VAULT_SEED ||
      process.env.KEEPER_SIGNER_SECRET;

    if (!activeSecret) {
      return safeJson({ success: false, error: "Relayer signer key not configured in environment." }, 500);
    }

    const relayerSigner = Keypair.fromSecret(activeSecret.trim());

    const txResponse: any = await bazaarVaultService.lockFunds(
      {
        escrowId,
        consumerAddress: relayerSigner.publicKey(),
        providerAddress: supplierAddress,
        amount: amountStroops,
        durationSecs,
        tokenContract: SAC_TOKEN_CONTRACT,
      },
      relayerSigner
    );

    const txHash = txResponse?.hash || txResponse?.txHash || "SETTLED_ON_CHAIN";

    try {
      const db = prisma as any;
      if (db?.escrowLock) {
        let provider = await db.serviceProvider.findFirst({
          where: {
            OR: [{ providerUid: supplierAddress }, { businessName: supplierAddress }],
          },
        });

        if (!provider) {
          provider = await db.serviceProvider.create({
            data: {
              businessName: `Supplier (${supplierAddress.slice(0, 8)})`,
              category: "WHOLESALE_LOGISTICS",
              description: `Automated B2B Restock Vendor for SKU: ${sku}`,
              providerUid: supplierAddress,
              sectorLocation: "Sector-02-B2B",
              mbzrRate: 1000.0,
              unitLabel: "mBZR/Pi",
              isVerified: true,
            },
          });
        }

        await db.escrowLock.create({
          data: {
            escrowId,
            consumerUid: retailerUid,
            providerId: provider.id,
            amount: netSupplierPi,
            token: "PI",
            status: "LOCKED",
            txid: txHash,
            sorobanTxHash: txHash,
            contractId: BAZAAR_VAULT_CONTRACT_ID,
            paymentId: channelTicketId || `TICKET_${escrowId}`,
            serviceDescription: `Wholesale Auto-Restock: ${quantity}x ${sku} (0.5% Melt Tariff Applied)`,
            timelockExpiresAt: new Date(Date.now() + 72 * 3600 * 1000),
          },
        });
      }
    } catch (dbErr: any) {
      console.warn("[RESTOCK_DB_SYNC_WARN]:", dbErr.message);
    }

    return safeJson(
      {
        success: true,
        protocol: "PROTOCOL-28-WHOLESALE",
        escrowId,
        txHash,
        settledAmountPi: netSupplierPi,
        exitTariffPi,
        sku,
        quantity,
        status: "Locked",
      },
      200
    );
  } catch (err: any) {
    console.error("[AUTO_RESTOCK_API_ERROR]:", err);
    return safeJson({ success: false, error: err?.message || "Auto-restock transaction failed" }, 500);
  }
}
