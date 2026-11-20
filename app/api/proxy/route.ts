import { NextResponse } from "next/server";
import { prisma } from "@/lib/mesh-prisma";

export const dynamic = "force-dynamic";

const ALLOWED_SECTORS = [
  "treasury",
  "vault",
  "adjudicator",
  "governance",
  "economy_core",
];
const PI_API_URL = process.env.PI_API_URL || "https://api.minepi.com/v2";

function unwrapId(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const candidate =
      obj.paymentId ??
      obj.txid ??
      obj.id ??
      obj.uid ??
      Object.values(obj)[0];
    return typeof candidate === "string" ? candidate.trim() : "";
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const targetSector = request.headers.get("x-target-sector");
    const sectorLogName = targetSector || "UNKNOWN_SECTOR";

    // 1. IDENTITY VERIFICATION (Proxy Gate)
    const internalClientToken =
      process.env.NEXT_PUBLIC_MESH_APP_CLIENT_TOKEN ||
      "UNCONFIGURED_SECURE_VAULT_TOKEN_FALLBACK_STRING";
    const expectedAuth = `Bearer ${internalClientToken}`;

    if (
      !authHeader ||
      (authHeader !== internalClientToken && authHeader !== expectedAuth)
    ) {
      console.warn(`[SECURITY ALERT] Unauthorized access attempt to: ${sectorLogName}`);
      return NextResponse.json(
        { error: "MESH-SCAN: Unauthorized. Internal Proxy Token mismatch." },
        { status: 403 }
      );
    }

    // 2. SECTOR VALIDATION
    if (!targetSector || !ALLOWED_SECTORS.includes(targetSector)) {
      console.warn(`[SECURITY ALERT] Invalid Sector Routing attempted: ${sectorLogName}`);
      return NextResponse.json(
        { error: `MESH-SCAN: Invalid Sector - ${sectorLogName}` },
        { status: 400 }
      );
    }

    const apiKey = process.env.PI_API_KEY?.trim();
    if (!apiKey) {
      console.error("[MESH FRACTURE] PI_API_KEY is missing from server env vault.");
      return NextResponse.json(
        { error: "Internal Core Configuration Error" },
        { status: 500 }
      );
    }

    // 3. PAYLOAD PROCESSING
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Malformed payload: Failed to digest JSON stream." },
        { status: 400 }
      );
    }

    const step = typeof body?.step === "string" ? body.step.trim() : "";
    const action = typeof body?.action === "string" ? body.action.trim() : "";
    const pioneerId =
      typeof body?.pioneerId === "string" ? body.pioneerId.trim() : "";

    let paymentId = unwrapId(body?.paymentId);
    let txid = unwrapId(body?.txid);

    if (!txid && body?.paymentId && typeof body.paymentId === "object") {
      txid = unwrapId((body.paymentId as Record<string, unknown>).txid);
    }

    // READ-ONLY BYPASS: Fetch treasury/pioneer vault data
    if (action === "FETCH_TREASURY_DATA") {
      if (!pioneerId) {
        return NextResponse.json(
          { error: "Missing pioneerId for treasury lookup." },
          { status: 400 }
        );
      }

      try {
        const pioneerData = await (prisma as any).pioneerNode.findUnique({
          where: { id: pioneerId },
        });

        return NextResponse.json({
          status: "MESH_SYNC_OK",
          sector: targetSector,
          data: pioneerData || {
            message: "No active vault found for this Pioneer.",
          },
        });
      } catch {
        console.warn(
          `[MESH-SCAN] DB lookup bypassed for identifier: ${pioneerId}`
        );
        return NextResponse.json({
          status: "MESH_SYNC_OK",
          sector: targetSector,
          data: {
            message: "Node active. No matching database entry for lookup ID.",
          },
        });
      }
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: "Missing baseline tracking identifier (paymentId)." },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // SECTOR PIPELINE A: TREASURY (Approval Handshake)
    // -------------------------------------------------------------------------
    if (targetSector === "treasury" || step === "approve") {
      if (paymentId.startsWith("MOCK_")) {
        return NextResponse.json({
          status: "MESH_SYNC_OK",
          sector: "treasury",
          message: "Mock payment verified and approved locally.",
          timestamp: new Date().toISOString(),
        });
      }

      const piResponse = await fetch(
        `${PI_API_URL}/payments/${encodeURIComponent(paymentId)}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${apiKey}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!piResponse.ok) {
        const errText = await piResponse.text().catch(() => "");
        console.error("[TREASURY FRACTURE] Pi approval rejected:", piResponse.status, errText);
        return NextResponse.json(
          { error: "Pi Network node rejected approval handshake." },
          { status: 502 }
        );
      }

      return NextResponse.json({
        status: "MESH_SYNC_OK",
        sector: "treasury",
        message: "Payment verified and approved on server.",
        timestamp: new Date().toISOString(),
      });
    }

    // -------------------------------------------------------------------------
    // SECTOR PIPELINE B: VAULT (Completion & Stake Locking)
    // -------------------------------------------------------------------------
    if (targetSector === "vault" || step === "complete") {
      if (!txid) {
        return NextResponse.json(
          { error: "Missing transaction cryptographic block ID (txid)." },
          { status: 400 }
        );
      }

      if (paymentId.startsWith("MOCK_")) {
        return NextResponse.json({
          status: "MESH_SYNC_OK",
          sector: "vault",
          nodeId: "5f9b3b9b9b9b9b9b9b9b9b9b",
          currentStake: 10.0,
          timestamp: new Date().toISOString(),
        });
      }

      const piResponse = await fetch(
        `${PI_API_URL}/payments/${encodeURIComponent(paymentId)}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Key ${apiKey}`,
          },
          body: JSON.stringify({ txid }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!piResponse.ok) {
        return NextResponse.json(
          { error: "Pi Blockchain failed to commit completion frame." },
          { status: 502 }
        );
      }

      const metaResponse = await fetch(
        `${PI_API_URL}/payments/${encodeURIComponent(paymentId)}`,
        {
          headers: { Authorization: `Key ${apiKey}` },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!metaResponse.ok) {
        return NextResponse.json(
          { error: "Failed to synchronize structural txn metadata." },
          { status: 502 }
        );
      }

      const verifiedPaymentData = await metaResponse.json().catch(() => null);
      const targetNodeId =
        typeof verifiedPaymentData?.metadata?.nodeId === "string"
          ? verifiedPaymentData.metadata.nodeId.trim()
          : "";
      const transactionAmount = Number(verifiedPaymentData?.amount ?? 0);

      if (!targetNodeId || !Number.isFinite(transactionAmount) || transactionAmount <= 0) {
        return NextResponse.json(
          { error: "Transaction lacks valid context metadata or amount mapping." },
          { status: 422 }
        );
      }

      const baseUpdate = await (prisma as any).pioneerNode.update({
        where: { id: targetNodeId },
        data: {
          stakedPi: { increment: transactionAmount },
          status: "ACTIVE",
          trustScore: { increment: 5 },
          lastActivityTimestamp: new Date(),
        },
      });

      return NextResponse.json({
        status: "MESH_SYNC_OK",
        sector: "vault",
        nodeId: baseUpdate.id,
        currentStake: baseUpdate.stakedPi,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      status: "MESH_SYNC_OK",
      sector: targetSector,
      message: "Sector placeholder executed silently.",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[PROXY CORE FRACTURE]", error?.message || error);
    return NextResponse.json(
      {
        error: "Sector Fracture Detected",
        message: error?.message || "Unknown processing error.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "MESH_ONLINE",
    protocol: "Neo Protocol / Project Bazaar",
    version: "v28 Testnet Readiness",
    uptimeShield: "90%",
  });
}