"use server";

// 🛡️ MESH-SECURE: Simulated Global Registry Lock
// In production, move this to your Prisma/Redis layer.
const swapRegistry = new Set<string>();

/**
 * 🛡️ MESH-SECURE: Verification of Security Circle Swap
 * Hardened with an Idempotency Gate (Nonce Check).
 */
export async function verifySecurityCircleSwap(pioneerUid: string, targetNode: string) {
  try {
    // 1. Generate a unique hash for this specific swap transaction
    const swapHash = `${pioneerUid}:${targetNode}`;

    // 2. IDEMPOTENCY GATE: Check if this swap has already been anchored
    if (swapRegistry.has(swapHash)) {
      console.warn(`[SECURITY ALERT] Replay Attempt Blocked: ${swapHash}`);
      return { 
        success: false, 
        verified: false, 
        message: "Fracture detected: Swap already processed." 
      };
    }

    if (!pioneerUid || !targetNode) {
      return { success: false, verified: false, message: "Invalid Swap: Credentials missing." };
    }

    // 3. ANCHOR: Lock the swap in the registry
    swapRegistry.add(swapHash);

    console.log(`[MESH-VERIFY] Anchoring swap for Pioneer: ${pioneerUid}`);

    // Simulate validation window
    await new Promise((resolve) => setTimeout(resolve, 50));

    return { 
      success: true, 
      verified: true, 
      message: "Security Circle Swap Verified: Node link secured." 
    };
  } catch (error) {
    console.error("[MESH FRACTURE] Swap validation failed:", error);
    return { success: false, verified: false, message: "Invalid Swap: System error." };
  }
}