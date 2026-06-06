import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Tier } from "@prisma/client";

// 🛡️ BAZAAR TECH: Force-Dynamic to prevent Vercel caching on registration
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { piUsername, piUid, roles } = body;
    const signature = req.headers.get('x-pi-signature');

    // 1. Identity Validation
    if (!piUsername || !piUid) {
      return NextResponse.json({ error: "Identity parameters missing." }, { status: 400 });
    }

    // 🛡️ GATEKEEPER: Placeholder for Signature Validation
    // This will eventually interface with the Pi SDK /verify-signature
    if (!signature) {
      console.warn(`[GATEKEEPER] Unauthorized attempt from: ${piUid}`);
      // Uncomment the return below when ready to enforce signature locking
      // return NextResponse.json({ error: "Unauthorized: Signature required." }, { status: 401 });
    }

    // 2. Tier Hierarchy Mapping
    const assignedTier = roles?.includes("elder") ? Tier.BAZAAR_FOUNDER : Tier.CITIZEN;

    // 3. Ledger Upsert
    // Note: 'uid' is the primary unique identifier in our schema
    const node = await prisma.pioneerNode.upsert({
      where: { uid: piUid }, 
      update: {
        username: piUsername, // Allows updating username if changed
        tier: assignedTier,
        lastActivityTimestamp: new Date(),
        status: "ACTIVE",
      },
      create: {
        uid: piUid,
        username: piUsername,
        tier: assignedTier,
        lastActivityTimestamp: new Date(),
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, node });

  } catch (error) {
    console.error("[ADJUDICATOR] Registration Fracture:", error);
    return NextResponse.json({ error: "Registration Failed" }, { status: 500 });
  }
}