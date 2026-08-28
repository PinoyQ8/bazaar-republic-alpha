import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { uid, status } = await req.json();
    if (!uid) {
      return NextResponse.json({ error: "MISSING_UID" }, { status: 400 });
    }

    const db = prisma as any;
    const node = await db.pioneerNode.upsert({
      where: { uid },
      update: { status: status || "ACTIVE", lastHeartbeat: new Date() },
      create: {
        uid,
        status: status || "ACTIVE",
        trustScore: 100.0,
        mbzrBalance: 0.0,
      },
    });

    return NextResponse.json({ success: true, node });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
