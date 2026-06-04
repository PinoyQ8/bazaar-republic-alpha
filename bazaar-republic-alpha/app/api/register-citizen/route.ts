import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/client"; 
import { Prisma } from "@prisma/client"; // 🛡️ Import Prisma namespace for types

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { piUsername, walletAddress, roles } = body;

    if (!piUsername || !walletAddress) {
      return NextResponse.json({ error: "Missing required identity parameters." }, { status: 400 });
    }

    // 🛡️ EXPLICIT TYPE DEFINITION: tx: Prisma.TransactionClient
    const citizen = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const pioneerRecord = await tx.pioneerNode.upsert({
        where: { username: piUsername },
        update: {
          role: roles?.includes("elder") ? "ELDER" : "PIONEER",
          lastActivityTimestamp: new Date(),
        },
        create: {
          username: piUsername,
          walletAddress: walletAddress,
          role: roles?.includes("elder") ? "ELDER" : "PIONEER",
        },
      });

      return pioneerRecord;
    });

    return NextResponse.json({ status: "SUCCESS", citizen }, { status: 200 });

  } catch (error: any) {
    console.error("[REGISTRATION FRACTURE]", error?.message || error);
    return NextResponse.json({ status: "FRACTURE", message: "Atomic registration failed." }, { status: 500 });
  }
}