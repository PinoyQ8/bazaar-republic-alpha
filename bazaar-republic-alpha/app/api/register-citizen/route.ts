import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// 🛡️ BAZAAR TECH: Import the Tier Enum from your generated client
import { Tier } from "@prisma/client"; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { piUsername, piUid, roles } = body;

    if (!piUsername || !piUid) {
      return NextResponse.json({ error: "Identity parameters missing." }, { status: 400 });
    }

    // 🛡️ BAZAAR TECH: Using the Enum member instead of the string literal
    // 🛡️ BAZAAR TECH: Using valid Schema Enum members
// Mapping "elder" to BAZAAR_FOUNDER (or MESH_GUARDIAN based on your governance hierarchy)
const assignedTier = roles?.includes("elder") ? Tier.BAZAAR_FOUNDER : Tier.CITIZEN;

await prisma.pioneerNode.upsert({
  where: { username: piUsername },
  update: {
    tier: assignedTier,
    lastActivityTimestamp: new Date(),
  },
  create: {
    username: piUsername,
    uid: piUid,
    tier: assignedTier, // Now strictly matches Enum
    lastActivityTimestamp: new Date(),
    status: "ACTIVE",
  },
});

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[ADJUDICATOR] Registration Fracture:", error);
    return NextResponse.json({ error: "Registration Failed" }, { status: 500 });
  }
}