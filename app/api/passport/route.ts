// app/api/passport/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json(
      { active: false, error: "Missing wallet address parameter." },
      { status: 400 }
    );
  }

  try {
    if (!prisma) {
      throw new Error("Prisma client uninitialized");
    }

    const pioneer = await prisma.pioneerNode.findFirst({
      where: {
        walletAddress: wallet,
      },
      select: {
        id: true,
        uid: true,
        username: true,
        walletAddress: true,
        status: true,
        trustScore: true,
        syncState: true,
        createdAt: true,
      },
    });

    if (!pioneer) {
      return NextResponse.json(
        {
          active: false,
          registered: false,
          message: "Pioneer node not found in state ledger.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        active: true,
        registered: true,
        pioneer: {
          ...pioneer,
          tier: "CITIZEN-NODE",
          uptimeShield: true,
          modulesCleared: [1, 2],
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[PASSPORT_QUERY_ERROR]:", error);
    return NextResponse.json(
      {
        active: false,
        degraded: true,
        error: "STATE_LEDGER_TEMPORARILY_OFFLINE",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}