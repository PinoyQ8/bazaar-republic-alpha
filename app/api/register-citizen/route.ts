import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { uid, username, walletAddress } = await req.json();
    if (!uid || !walletAddress) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const db = prisma as any;
    const citizen = await db.pioneerNode.upsert({
      where: { uid },
      update: { 
        username, 
        walletAddress, 
        tier: "CITIZEN" 
      },
      create: {
        uid,
        username,
        walletAddress,
        tier: "CITIZEN",
        status: "ACTIVE",
        trustScore: 100.0,
      },
    });

    return NextResponse.json({ success: true, citizen });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
