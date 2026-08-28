// TARGET: [project-root]/app/governance/dashboard/page.tsx
'use client';
import { GovernanceRegistry } from '@/services/GovernanceRegistry';

export default function GovernanceDashboard({ uid }: { uid: string }) {
  const pioneer = GovernanceRegistry.getPioneer(uid);
  const influence = GovernanceRegistry.getInfluence(uid);

  if (!pioneer) return <div>Node not institutionalized.</div>;

  return (
    <div className="mesh-dashboard-grid">
      {/* 🛡️ SECURITY STATUS */}
      <div className={`status-card ${pioneer.nodeUptimeScore < 90 ? 'alert' : 'secure'}`}>
        <h3>Republic Shield: {pioneer.nodeUptimeScore}% Uptime</h3>
        {pioneer.canVote === false && <p className="penalty">VOTING RIGHTS SUSPENDED</p>}
      </div>

      {/* 📊 INFLUENCE ANCHORS */}
      <div className="influence-metrics">
        <div className="metric">Trust Score (TS): {pioneer.trustScore}</div>
        <div className="metric">mBZR Stake: {pioneer.mBZRStake}</div>
        <div className="metric">Total PIS: {influence}</div>
      </div>

      {/* 🗳️ TIERED VOTING MODULE */}
      <div className="vote-panel">
        <h2>Proposal Stream: {pioneer.role} Tier</h2>
        <button disabled={!pioneer.canVote}>Cast Governance Vote</button>
      </div>
    </div>
  );
}