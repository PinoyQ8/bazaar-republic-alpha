import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const REBALLOT_48H_MS = 48 * 60 * 60 * 1000;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const {
      chamber1Mode = "FOUNDER_ACTIVE",
      signers = [],
      action,
      publicRationale,
      modifiedTitle,
      modifiedDescription,
      modifiedValue,
    } = body as {
      chamber1Mode?: "FOUNDER_ACTIVE" | "DESCENDANTS_ACTIVE";
      signers?: Array<{
        uid: string;
        role: "BAZAAR_FOUNDER" | "FOUNDER_DESCENDANT";
        weightPct: number;
      }>;
      action?: "APPROVE_OVERRIDE" | "MODIFY_AND_RESUBMIT" | "SOFT_VETO";
      publicRationale?: string;
      modifiedTitle?: string;
      modifiedDescription?: string;
      modifiedValue?: number;
    };

    if (!action || !publicRationale || publicRationale.trim().length < 15) {
      return NextResponse.json(
        {
          success: false,
          error:
            "RATIONALE_REQUIRED: Action and public rationale (>= 15 chars) are mandatory.",
        },
        { status: 400 }
      );
    }

    if (chamber1Mode === "FOUNDER_ACTIVE") {
      if (!signers.some((s) => s.role === "BAZAAR_FOUNDER")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "CHAMBER_1_UNAUTHORIZED: Active BAZAAR_FOUNDER signature required.",
          },
          { status: 403 }
        );
      }
    } else {
      const descendantWeight = signers
        .filter((s) => s.role === "FOUNDER_DESCENDANT")
        .reduce((sum, s) => sum + s.weightPct, 0);
      if (descendantWeight < 80) {
        return NextResponse.json(
          {
            success: false,
            error: `DESCENDANT_QUORUM_INSUFFICIENT: Signed weight ${descendantWeight}% < 80% required.`,
          },
          { status: 403 }
        );
      }
    }

    const proposal = await prisma.internalProposal.findUnique({ where: { id } });
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "PROPOSAL_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (proposal.status !== "HOLD_AND_MODIFY") {
      return NextResponse.json(
        {
          success: false,
          error: `INVALID_STATE: Expected HOLD_AND_MODIFY, got '${proposal.status}'.`,
        },
        { status: 409 }
      );
    }

    const now = new Date();
    if (proposal.holdExpiresAt && now > proposal.holdExpiresAt) {
      const expired = await prisma.internalProposal.update({
        where: { id },
        data: {
          status: "EXPIRED",
          holdReason:
            "HOLD_WINDOW_ELAPSED: 72-hour Chamber 1 decision window expired without action.",
        },
      });
      return NextResponse.json(
        { success: false, error: "HOLD_WINDOW_EXPIRED", proposal: expired },
        { status: 422 }
      );
    }

    const sealHash = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          proposalId: id,
          action,
          chamber1Mode,
          signers: signers.map((s) => s.uid).sort(),
          rationale: publicRationale.trim(),
          timestamp: now.toISOString(),
        })
      )
      .digest("hex");

    if (action === "APPROVE_OVERRIDE") {
      const updated = await prisma.internalProposal.update({
        where: { id },
        data: {
          status: "EXECUTED",
          visionAlignmentPct: 100,
          holdReason: `FOUNDER_OVERRIDE_APPROVED: ${publicRationale.trim()}`,
          executionSealHash: sealHash,
          executedAt: now,
          holdExpiresAt: null,
        },
      });
      return NextResponse.json(
        { success: true, status: "EXECUTED", sealHash, proposal: updated },
        { status: 200 }
      );
    }

    if (action === "MODIFY_AND_RESUBMIT") {
      const updated = await prisma.internalProposal.update({
        where: { id },
        data: {
          title: modifiedTitle?.trim() || proposal.title,
          description: modifiedDescription?.trim() || proposal.description,
          proposedValue:
            typeof modifiedValue === "number"
              ? modifiedValue
              : proposal.proposedValue,
          status: "ACTIVE",
          votesFor: 0,
          votesAgainst: 0,
          holdReason: `COLLABORATIVE_MODIFICATION: ${publicRationale.trim()}`,
          expiresAt: new Date(now.getTime() + REBALLOT_48H_MS),
          holdExpiresAt: null,
        },
      });
      return NextResponse.json(
        {
          success: true,
          status: "ACTIVE_REBALLOT_48H",
          sealHash,
          proposal: updated,
        },
        { status: 200 }
      );
    }

    const vetoed = await prisma.internalProposal.update({
      where: { id },
      data: {
        status: "REJECTED",
        holdReason: `FOUNDER_SOFT_VETO: ${publicRationale.trim()}`,
        executionSealHash: sealHash,
        holdExpiresAt: null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        status: "REJECTED_SOFT_VETO",
        sealHash,
        proposal: vetoed,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[MESH-FRACTURE] Founder Hold Route Fault:", error);
    return NextResponse.json(
      { success: false, error: error.message || "SERVER-LOGIC-FAULT" },
      { status: 500 }
    );
  }
}