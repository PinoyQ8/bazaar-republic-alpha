// Location: /app/api/mesh/pioneer-vault/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Prevent multiple Prisma client instances during hot-reloading on the X570 workstation
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// GET: Retrieve or lazily initialize Pioneer Vault status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pioneerId = searchParams.get("pioneerId");

    if (!pioneerId) {
      return NextResponse.json({ error: "Pioneer ID required" }, { status: 400 });
    }

    let vault = await prisma.pioneerVault.findUnique({
      where: { pioneerId },
    });

    if (!vault) {
      vault = await prisma.pioneerVault.create({
        data: {
          pioneerId,
          walletAddress: `pi_wallet_${pioneerId}`,
          vaultState: "Active",
          masterNodes: ["node_alpha_x570", "node_beta_nitro", "node_gamma_s23"],
          unlockSigs: [],
        },
      });
    }

    return NextResponse.json({ status: "success", vault });
  } catch (error) {
    console.error("[MESH API ERROR] GET /api/mesh/pioneer-vault:", error);
    return NextResponse.json({ status: "error", message: "Database query failed" }, { status: 500 });
  }
}

// POST: Execute Vault State Transitions (Active -> PendingLock -> Locked)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pioneerId, targetState } = body;

    if (!pioneerId || !targetState) {
      return NextResponse.json(
        { error: "Missing required parameters (pioneerId, targetState)" },
        { status: 400 }
      );
    }

    // 🛡️ CORRECT (BigInt purged, natively returning a number/Float)
const timestamp =
  targetState === "PendingLock" || targetState === "Locked"
    ? Math.floor(Date.now() / 1000)
    : null;

    const updatedVault = await prisma.pioneerVault.update({
      where: { pioneerId },
      data: {
        vaultState: targetState,
        lockTimestamp: timestamp,
        ...(targetState === "Active" ? { unlockSigs: [] } : {}),
      },
    });

    return NextResponse.json({
      status: "success",
      message: `Pioneer vault state transitioned to: ${targetState}`,
      vault: updatedVault,
    });
  } catch (error) {
    console.error("[MESH API ERROR] POST /api/mesh/pioneer-vault:", error);
    return NextResponse.json({ status: "error", message: "Vault state update failed" }, { status: 500 });
  }
}