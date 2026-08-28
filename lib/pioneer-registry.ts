// lib/pioneer-registry.ts
import Token from "../models/Token";

/**
 * Maps the Pi SDK uid to the Bazaar Republic DAO Ledger.
 * If the pioneer does not exist in the ledger, we initialize their node.
 */
export async function resolvePioneer(uid: string) {
  // 1. Search for existing entry
  let pioneer = await Token.findOne({ ownerId: uid });

  // 2. If new Pioneer, create their initial genesis node
  if (!pioneer) {
    pioneer = await Token.create({
     ownerId: uid,
      amount: 0, // Initial state
      // 🛡️ ZERO-TRUST SHIELD: Align to the strict Token Schema enum
      status: "LIQUID"
    });
    console.log(`[MESH-LOG] Genesis node established for UID: ${uid}`);
  }

  return pioneer;
}