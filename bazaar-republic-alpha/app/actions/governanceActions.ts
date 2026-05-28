"use server";

// 🛡️ THE ALIGNED DATABASE BRIDGE
import { connectToDatabase } from "@/lib/db"; 

// 🛡️ THE ALIGNED SCHEMA BRIDGE (Using Named Destructuring)
import { PioneerNode } from "@/models/PioneerNode"; 

// ----------------------------------------------------------------------
// 1. 🛡️ MESH-VAULT: Register Node & Lock Stake (Sector 1)
// ----------------------------------------------------------------------
export async function registerSecurityCircle(formData: FormData) {
  const pioneerId = formData.get("pioneerId") as string;
  const publicAddress = formData.get("publicAddress") as string;
  const stakeAmount = parseFloat(formData.get("stakeAmount") as string || "0");
  const TREASURY_WALLET = process.env.DAO_TREASURY_WALLET || "UNCONFIGURED_TREASURY";

  // 🛡️ GATE 1: THE IDENTITY LOCK
  if (!pioneerId || pioneerId === "DISCONNECTED_NODE") {
    return { success: false, message: "MESH-REJECT: Anonymous or Disconnected Nodes cannot write to the DAO ledger." };
  }

  // 🛡️ GATE 2: MINIMUM STAKING THRESHOLD
  if (stakeAmount < 10) {
    return { success: false, message: "MESH-REJECT: A minimum stake of 10 Test-Pi is required." };
  }

  try {
    // 🚀 EXECUTE EXACT DB UPLINK
    await connectToDatabase(); 

    // 🛡️ GATE 3: THE SYBIL SHIELD (Using 'PioneerNode' instead of PioneerModel)
    const existingWallet = await PioneerNode.findOne({ wallet_address: publicAddress });
    
    if (existingWallet && existingWallet.username !== pioneerId) {
      return {
        success: false,
        message: "MESH-FRACTURE: Burner wallet is already secured by another active node.",
      };
    }

    // 🛡️ THE LEDGER UPSERT (Using 'PioneerNode')
    const updatedNode = await PioneerNode.findOneAndUpdate(
      { username: pioneerId }, 
      {
        username: pioneerId,
        wallet_address: publicAddress,
        stake_amount: stakeAmount,
        kyc_status: "PASSED",
        node_tier: "Standard",
        status: "active"
      },
      { new: true, upsert: true } 
    );

    console.log(`[MESH-BRIDGE] 🟢 Sector 1 Secured for Node: ${pioneerId}`);

    return { 
      success: true, 
      message: `[SECTOR 1 SECURED] Node successfully staked ${stakeAmount} Test-Pi.`,
      data: updatedNode
    };

  } catch (error) {
    console.error("[MESH-BRIDGE] 🚨 Ledger Write Failure:", error);
    return { success: false, message: "MESH-FRACTURE: Database transaction failed to execute." };
  }
}

// ----------------------------------------------------------------------
// 2. 🛡️ MESH-SCAN: Node Status Verifier
// ----------------------------------------------------------------------
export async function getSecurityCircleStatus(pioneerId: string) {
  try {
    const db = await connectToDatabase();
    
    const node = await PioneerNode.findOne({ username: pioneerId }).lean();

    if (node) {
      return { 
        success: true, 
        // Stringify ObjectIds to prevent Next.js Client Component fractures
        data: {
          ...node,
          _id: node._id.toString(),
          stakedAt: node.stakedAt ? node.stakedAt.toISOString() : null,
          registeredAt: node.registeredAt ? node.registeredAt.toISOString() : null
        } 
      };
    }

    return { success: false, message: "NODE_NOT_FOUND" };
    
  } catch (error) {
    console.error("[MESH-BRIDGE] 🚨 Status Scan Fracture:", error);
    return { success: false, message: "VAULT_READ_ERROR" };
  }
}