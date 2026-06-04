import { prisma } from "../../prisma/client"; // 🛡️ ROUTED TO UNIFIED MONGO LEDGER

export async function checkGovernanceEligibility(pioneerUid: string) {
  try {
    // 1. Interrogate the Pioneer's TrustScore (TS) via unified PioneerNode collection
    // 🛡️ FIX TS 2339: Targeted prisma.pioneerNode and aligned lookup to the @unique username field
    const pioneer = await prisma.pioneerNode.findUnique({
      where: { username: pioneerUid },
      select: { trustScore: true }
    });

    if (!pioneer) {
      console.warn(`[GOVERNANCE ALERT] Node validation rejected for UID: ${pioneerUid}`);
      return { eligible: false, error: "Pioneer container not registered in MESH." };
    }

    console.log(`[GOVERNANCE] TrustScore verified for ${pioneerUid}: ${pioneer.trustScore}`);
    
    // Execute downstream governance calculation logic...
    const isEligible = pioneer.trustScore >= 100; 
    return { eligible: isEligible, trustScore: pioneer.trustScore };

  } catch (error: any) {
    console.error("[GOVERNANCE CORE FRACTURE]", error?.message || error);
    return { eligible: false, error: error?.message || "Internal sector processing error." };
  }
}