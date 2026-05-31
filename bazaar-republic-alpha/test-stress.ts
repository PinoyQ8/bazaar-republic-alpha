// test-stress.ts
import { verifySecurityCircleSwap } from "./app/actions/onboardingActions";

async function runStressTest() {
  const pioneerUid = "TEST_PIONEER_STRESS";
  const txHash = "STRESS_TEST_HASH_" + Date.now();

  console.log("🚀 Starting MESH-STRESS: Concurrent Replay Attack Simulation");

  // Simulate 10 simultaneous requests with the SAME TxHash (Double-Spend/Replay)
  const tasks = Array.from({ length: 10 }).map(() => 
    verifySecurityCircleSwap(pioneerUid, txHash)
  );

  const results = await Promise.all(tasks);

  // Analyze the Vault Integrity
  const successes = results.filter(r => r.success).length;
  console.log(`✅ Successes: ${successes} (Expected: 1)`);
  console.log(`🛡️ Failures: ${results.length - successes} (Expected: 9)`);
  
  if (successes > 1) {
    console.error("🚨 FRACTURE DETECTED: Double-spending vulnerability confirmed.");
  } else {
    console.log("✨ MESH INTEGRITY: Replay attack mitigated.");
  }
}

runStressTest();