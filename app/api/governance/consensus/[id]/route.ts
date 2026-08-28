// Location: app/api/governance/consensus/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = prisma as any;

    const proposal = await db.internalProposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, message: "Proposal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      proposalId: proposal.id,
      title: proposal.title,
      description: proposal.description,
      status: proposal.status,
      proposerUid: proposal.authorUid,
      consensus: {
        votesFor: proposal.votesFor ?? 0,
        votesAgainst: proposal.votesAgainst ?? 0,
      },
      audit: {
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch consensus" },
      { status: 500 }
    );
  }
}