// test-governance.ts
async function fireTestVote(payload: any) {
  try {
    const res = await fetch('http://localhost:3000/api/governance/submit-vote', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // 🛡️ MESH COOKIE INJECTION: Bypassing the Stage 2 Gatekeeper Check
        'Cookie': `pioneer_uid=${payload.pioneer_id || payload.pioneerUid}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log(`[STATUS ${res.status}]`, data);
  } catch (err) {
    console.error("Connection failed.", err);
  }
}

async function runSuite() {
  console.log("🚀 INITIATING GOVERNANCE LOCAL TEST SUITE...");

  // 1. Test Vector Beta: Unauthorized Node (The Ghost)
  console.log("\n--- Testing Vector Beta: Unauthorized Node ---");
  await fireTestVote({
    pioneer_id: "ghost_node_999",
    pioneerUid: "ghost_node_999", // Cookie redundant injection
    proposal_id: "6a255b750523e68f6829b570",
    vote_decision: "YES"
  });

  // 2. Test Vector Epsilon: Standard Valid Vote (The Anchor)
  console.log("\n--- Testing Vector Epsilon: Standard Valid Vote ---");
  const standardVotePayload = {
    pioneer_id: 'pioneer_alpha_node',
    pioneerUid: 'pioneer_alpha_node', 
    proposal_id: '6a255b750523e68f6829b570', // 🛡️ BAZAAR TECH: Anchored ID
    vote_decision: 'YES'
  };
  await fireTestVote(standardVotePayload);

  // 3. Test Vector Delta: Front-Running Shield (The Lock)
  console.log("\n--- Testing Vector Delta: Double-Vote Shield ---");
  // Firing the exact same anchored payload a second time
  await fireTestVote(standardVotePayload);
}

runSuite();