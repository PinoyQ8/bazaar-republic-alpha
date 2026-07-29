// Location: /app/api/mesh-seed/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import { Pioneer, Proposal } from "@/app/models/mesh-schema";

export async function GET() {
  try {
    // 🛡️ Connect to the Ledger
    await dbConnect();

    // 🛡️ STEP 1: Inject Genesis Founder Node
    const testUid = "GENESIS-FOUNDER-001";
    
    const pioneer = await Pioneer.findOneAndUpdate(
      { uid: testUid },
      {
        uid: testUid,
        username: "Bazaar Founder",
        isKYCVerified: true,
        isNodeBound: true,
        rollingUptime30D: 0.95, // 95% Uptime (Triggers max U_shield)
        txCount30D: 60,         // 60 Transactions (Triggers max C_flow)
        stakedPi: 2500,         // 2500 Pi Staked
        activePenalties: 0,
        lastProposalTimestamp: null,
      },
      { upsert: true, new: true }
    );

    // 🛡️ STEP 2: Inject Test Proposal
    const proposalId = "PROP-MESH-2026-001";
    
    const proposal = await Proposal.findOneAndUpdate(
      { proposalId },
      {
        proposalId,
        proposerUid: testUid,
        tierOrigin: "Genesis",
        title: "Deploy 26.1.0 Dual-Vector Quorum & Quadratic Staking",
        rawText: "This protocol upgrade hard-codes the separation between unique node participation (Quorum) and economic weight (Voting Power) across all E-Network nodes.",
        status: "ACTIVE_VOTING",
        clearanceHash: "mesh_hash_verified_99f2a8c1",
        startTime: new Date(),
        endTime: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 Hours from now
        eligibleNodesCount: 100,
        totalParticipants: 0,
        yesVP: 0,
        noVP: 0,
      },
      { upsert: true, new: true }
    );

    // 🛡️ STEP 3: Seed LocalStorage Mock Credentials Helper
    // Note: To test on the frontend, ensure your browser's localStorage has:
    // localStorage.setItem("pi_auth_user", JSON.stringify({ uid: "GENESIS-FOUNDER-001", username: "Bazaar Founder" }));

    return NextResponse.json({
      message: "MESH Ledger Successfully Seeded",
      pioneer: { uid: pioneer.uid, username: pioneer.username },
      proposal: { proposalId: proposal.proposalId, title: proposal.title }
    }, { status: 200 });

  } catch (error) {
    console.error("[MESH] Seeding Failure:", error);
    return NextResponse.json({ error: "Failed to seed ledger" }, { status: 500 });
  }
}