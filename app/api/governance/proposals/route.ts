// Location: app/api/governance/proposals/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const db = prisma as any;
    const proposals = await db.internalProposal.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        votes: true,
      },
    });

    return NextResponse.json(
      { success: true, count: proposals.length, proposals },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[MESH-FRACTURE] GET Master Proposals Failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "SERVER-LOGIC-FAULT" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, authorUid, proposerUid, expiresAt } = body;

    const resolvedProposerUid = proposerUid || authorUid;

    if (!title || !description || !resolvedProposerUid) {
      return NextResponse.json(
        {
          success: false,
          error: "MALFORMED_PAYLOAD: Missing title, description, or author/proposer UID.",
        },
        { status: 400 }
      );
    }

    const db = prisma as any;

    const newProposal = await db.internalProposal.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        authorUid: resolvedProposerUid,
        proposerUid: resolvedProposerUid,
        status: "ACTIVE",
        votesFor: 0,
        votesAgainst: 0,
        expiresAt: expiresAt
          ? new Date(expiresAt)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json(
      {
        success: true,
        proposal: newProposal,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[MESH-FRACTURE] POST Proposal Logic Fault:", error);
    return NextResponse.json(
      { success: false, error: error.message || "SERVER-LOGIC-FAULT" },
      { status: 500 }
    );
  }
}