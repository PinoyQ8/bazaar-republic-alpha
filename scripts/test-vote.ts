// TARGET: [project-root]/scripts/test-vote.ts
import { GovernanceRegistry } from '../services/GovernanceRegistry';

async function runSimulation() {
  console.log("--- MESH-SCAN: GOVERNANCE AUDIT INITIATED ---");

  // 🛡️ FULL PAYLOAD REQUIRED BY REGISTRY INTERFACE
  GovernanceRegistry.registerPioneer({
    uid: "Bazaar_Founder_01",
    role: "FOUNDER",        // 🛡️ Added Role
    username: "PinoyQ8",
    ageInMonths: 12,
    mBZRStake: 500,
    nodeUptimeScore: 92,
    trustScore: 95,         // 🛡️ Added TrustScore
    influenceScore: 0       // Placeholder
  });

  console.log("Submitting vote payload...");
  const influence = GovernanceRegistry.getInfluence("Bazaar_Founder_01");

  if (influence !== null && influence >= 10) {
    console.log(`✅ ADJUDICATOR GRANTED ACCESS. Weight Applied: ${influence.toFixed(2)}`);
  } else {
    console.log("❌ ADJUDICATOR BLOCKED: Insufficient Influence.");
  }
}

runSimulation();