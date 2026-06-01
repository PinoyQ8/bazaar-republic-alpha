// 🛡️ MESH GOVERNANCE: LIFECYCLE AUTOMATION
import { Proposal } from '@/models/proposal'; // ⚡ FIXED: Perfectly aligned with the core Ledger schema

export async function finalizeProposal(proposalId: string) {
  const proposal = await Proposal.findById(proposalId);
  
  if (!proposal || proposal.status !== 'ACTIVE') {
    return { success: false, reason: 'ALREADY_FINALIZED_OR_NOT_FOUND' };
  }

  // 🛡️ AUTOMATION TRIGGERS
  const now = new Date();
  const expiresAt = new Date(proposal.createdAt.getTime() + (proposal.durationDays * 24 * 60 * 60 * 1000));
  const hasExpired = now > expiresAt;
  const hasMetQuorum = proposal.votedUids.length >= proposal.quorumRequirement;

  if (hasExpired || hasMetQuorum) {
    // Determine Result
    let totalFor = 0;
    let totalAgainst = 0;
    Object.values(proposal.tierMetrics).forEach((tier: any) => {
      totalFor += (tier.votesFor || 0);
      totalAgainst += (tier.votesAgainst || 0);
    });

    const newStatus = totalFor > totalAgainst ? 'PASSED' : 'REJECTED';

    // Atomic Finalization
    await Proposal.updateOne(
      { _id: proposalId },
      { 
        $set: { 
          status: newStatus,
          finalizedAt: new Date()
        } 
      }
    );

    return { success: true, status: newStatus };
  }

  return { success: false, reason: 'PENDING_THRESHOLD' };
}