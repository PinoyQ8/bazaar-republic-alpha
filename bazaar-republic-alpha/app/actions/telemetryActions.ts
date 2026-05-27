"use server";

import { connectToLedger } from "@/lib/mongodb";

// ----------------------------------------------------------------------
// 1. 🛡️ MESH-RADAR: Command Center Global Telemetry (Sector 2)
// ----------------------------------------------------------------------
export async function getMeshTelemetry() {
  try {
    const db = await connectToLedger();
    
    // Pull the entire Genesis Roster, newest first
    const roster = await db.collection("security_circles")
      .find({})
      .sort({ registeredAt: -1 })
      .toArray();

    // ⚙️ Execute Vault Aggregations Server-Side
    const totalNodes = roster.length;
    const activeValidators = roster.filter(node => node.kyc_status === "VALIDATOR_ACTIVE").length;
    const bootstrapNodes = roster.filter(node => node.kyc_status === "BOOTSTRAP_LOCKED").length;
    const priorityNodes = roster.filter(node => node.is_priority === true).length;
    
    // Calculate the total Test-Pi locked in the Treasury
    const totalStake = roster.reduce((sum, node) => sum + (Number(node.stakeAmount) || 0), 0);

    return {
      success: true,
      data: {
        metrics: {
          totalNodes,
          activeValidators,
          bootstrapNodes,
          priorityNodes,
          totalStake,
          targetLimit: 100
        },
        // Serialize MongoDB ObjectIds and Dates for the Next.js boundary
        roster: roster.map(node => ({
          ...node,
          _id: node._id.toString(),
          stakedAt: node.stakedAt ? node.stakedAt.toISOString() : null,
          registeredAt: node.registeredAt ? node.registeredAt.toISOString() : null
        }))
      }
    };
  } catch (error) {
    console.error("[MESH-COMMAND] 🚨 Telemetry Fracture:", error);
    return { success: false, message: "VAULT_READ_ERROR" };
  }
}

// ----------------------------------------------------------------------
// 2. 🛡️ MESH-CRON: Node Upgrade Protocol (Sector 3)
// ----------------------------------------------------------------------
export async function upgradeBootstrapNodes(forceAlphaBypass: boolean = false) {
  try {
    const db = await connectToLedger();
    const collection = db.collection("security_circles");

    // The True MESH Logic: 24-Hour Time Delta
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Default: Only upgrade nodes older than 24 hours
    let query: any = { 
      kyc_status: "BOOTSTRAP_LOCKED", 
      stakedAt: { $lte: twentyFourHoursAgo } 
    };

    // 🛡️ ALPHA-TRACK BYPASS: Override the clock for local X570 testing
    if (forceAlphaBypass) {
      query = { kyc_status: "BOOTSTRAP_LOCKED" };
    }

    const result = await collection.updateMany(
      query,
      { 
        $set: { 
          kyc_status: "VALIDATOR_ACTIVE",
          upgradedAt: new Date()
        } 
      }
    );

    return { 
      success: true, 
      message: `PROTOCOL EXECUTED: ${result.modifiedCount} nodes upgraded to Validator Shield.`,
      upgradedCount: result.modifiedCount
    };

  } catch (error) {
    console.error("[MESH-CRON] 🚨 Upgrade Fracture:", error);
    return { success: false, message: "VAULT_WRITE_ERROR" };
  }
}