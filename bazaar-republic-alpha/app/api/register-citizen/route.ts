import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client"; // 🛡️ Fix: Namespace import
import { prisma } from "@/lib/mesh-prisma";

// 🛡️ NEO PROTOCOL: Hard-lock to dynamic execution
export const dynamic = 'force-dynamic';

export async function POST(request: Request) { // Consistent naming
  try {
    // 🛡️ MESH FIX: Corrected 'req' to 'request'
    const body = await request.json(); 
    const { piUsername, walletAddress, roles } = body;

    if (!piUsername || !walletAddress) {
      return NextResponse.json(
        { error: "Missing required identity parameters." }, 
        { status: 400 }
      );
    }

    // 🛡️ ATOMIC TRANSACTION: Uses imported Prisma namespace
    const citizen = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      return await tx.pioneerNode.upsert({
        where: { username: piUsername },
        update: {
          role: roles?.includes("elder") ? "ELDER" : "PIONEER",
          lastActivityTimestamp: new Date(),
        },
        create: {
          username: piUsername,
          walletAddress: walletAddress,
          role: roles?.includes("elder") ? "ELDER" : "PIONEER",
          status: "ACTIVE",
        },
      });
    });

    return NextResponse.json({ status: "SUCCESS", citizen }, { status: 200 });

  } catch (error: any) {
    // 🛡️ ERROR LOGGING: Captured within scope
    console.error("[REGISTRATION FRACTURE]", error?.message || error);
    return NextResponse.json(
      { status: "FRACTURE", message: "Atomic registration failed." }, 
      { status: 500 }
    );
  }
}