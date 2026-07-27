// Location: /app/api/propose/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

// Internal MESH Logic
import { SecurityAdjudicator, ProposerContext, ProposalDraft, TierLevel } from "@/app/utils/mesh-adjudicator";
import { TrustScoreEngine, NodeTelemetry } from "@/app/utils/mesh-trustscore";

// Database Models
import dbConnect from "@/app/utils/dbConnect";
import { Pioneer, Proposal } from "@/app/models/mesh-schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, title, rawText } = body;

    if (!uid || !title || !rawText) {
      return NextResponse.json({ error: "Invalid Payload: Missing Core Variables" }, { status: 400 });
    }

    // 🛡️ STEP 1: Connect to the Ledger
    await dbConnect();

    // 🛡️ STEP 2: Fetch Pioneer Data & Calculate Live TS
    const pioneer = await Pioneer.findOne({ uid });
    if (!pioneer) {
      return NextResponse.json({ error: "Node Identity Not Found in Ledger" }, { status: 404 });
    }

    const telemetry: NodeTelemetry = {
      nodeId: pioneer.uid,
      isKYCVerified: pioneer.isKYCVerified,
      isNodeBound: pioneer.isNodeBound,
      rollingUptime30D: pioneer.rollingUptime30D,
      txCount30D: pioneer.txCount30D,
      stakedPi: pioneer.stakedPi,
      activePenalties: pioneer.activePenalties,
    };

    const powerMatrix = TrustScoreEngine.calculatePowerMatrix(telemetry);
    const ts = powerMatrix.trustScore;

    // Determine current algorithmic tier
    let currentTier: TierLevel = 'Citizen'; // Default fallback
    if (ts >= 90) currentTier = 'Genesis';
    else if (ts >= 75) currentTier = 'Merchant';
    else if (ts < 50) {
      return NextResponse.json({ error: "Ghost Status: TS below 50. Voting rights locked." }, { status: 403 });
    }

    // 🛡️ STEP 3: Construct Adjudicator Payloads
    const draftId = crypto.randomUUID();
    const draft: ProposalDraft = { draftId, title, rawText };
    
    const context: ProposerContext = {
      nodeId: pioneer.uid,
      tier: currentTier,
      lastProposalTimestamp: pioneer.lastProposalTimestamp ? new Date(pioneer.lastProposalTimestamp).getTime() : null,
      currentTS: ts,
    };

    // 🛡️ STEP 4: Execute Security Adjudicator Gate
    const adjudication = SecurityAdjudicator.verifyProposal(draft, context);

    if (adjudication.status === 'REJECTED') {
      // If Constitutional Violation, apply P_slash penalty directly to the DB
      if (adjudication.violationLog?.includes('CONSTITUTIONAL_VIOLATION')) {
        pioneer.activePenalties += 50; 
        await pioneer.save();
        console.warn(`[MESH ALERT] Node ${uid} penalized for Constitutional Breach. TS slashed.`);
      }

      return NextResponse.json({ 
        error: "Adjudicator Rejected Draft", 
        log: adjudication.violationLog 
      }, { status: 406 });
    }

    // 🛡️ STEP 5: Draft Passed. Write to Ledger & Trigger Timers
    const newProposal = await Proposal.create({
      proposalId: draftId,
      proposerUid: uid,
      tierOrigin: currentTier,
      title: title,
      rawText: rawText,
      status: 'ACTIVE_VOTING',
      clearanceHash: adjudication.clearanceHash,
      startTime: new Date(),
    });

    // Reset Pioneer's cooldown timer
    pioneer.lastProposalTimestamp = new Date();
    await pioneer.save();

    return NextResponse.json({
      message: "Proposal Forged & Synced to E-Network",
      proposalId: newProposal.proposalId,
      clearanceHash: newProposal.clearanceHash,
      status: "ACTIVE_VOTING"
    }, { status: 201 });

  } catch (error) {
    console.error("[MESH] Submission Gateway Failure:", error);
    return NextResponse.json({ error: "Internal Ledger Desync" }, { status: 500 });
  }
}