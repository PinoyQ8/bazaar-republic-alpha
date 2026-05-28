"use server";

<<<<<<< HEAD
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

  // ----------------------------------------------------------------------
  // 🛡️ GATE 2: MAXIMUM BASE EQUITY CEILING
  // ----------------------------------------------------------------------
  const MIN_STAKE_PI = 10;
  const MAX_STAKE_PI = 1000;

  if (stakeAmount < MIN_STAKE_PI) {
    return { success: false, message: `MESH-REJECT: A minimum stake of ${MIN_STAKE_PI} Test-Pi is required.` };
  }

  // The ceiling is hard-coded. Multipliers are applied AFTER this gate.
  if (stakeAmount > MAX_STAKE_PI) {
    return { 
      success: false, 
      message: `MESH-REJECT: Base stake capped at ${MAX_STAKE_PI} Pi to prevent network centralization.` 
    };
  }

  try {
    // 🚀 EXECUTE EXACT DB UPLINK
    await connectToDatabase(); 

    // 🛡️ GATE 3: THE SYBIL SHIELD
    const existingWallet = await PioneerNode.findOne({ wallet_address: publicAddress });
    
    // ⚠️ ALIGNED: Changed username to uid
    if (existingWallet && existingWallet.uid !== pioneerId) {
      return {
        success: false,
        message: "MESH-FRACTURE: Burner wallet is already secured by another active node.",
      };
    }

    // 🛡️ THE LEDGER UPSERT
    const updatedNode = await PioneerNode.findOneAndUpdate(
      { uid: pioneerId }, // ⚠️ ALIGNED: Changed username to uid
      {
        uid: pioneerId,   // ⚠️ ALIGNED: Changed username to uid
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
    await connectToDatabase();
    
    // ⚠️ ALIGNED: Changed username to uid
    const node = await PioneerNode.findOne({ uid: pioneerId }).lean();

    if (node) {
      return { 
        success: true, 
        // Stringify ObjectIds to prevent Next.js Client Component fractures
        data: {
          ...node,
          _id: node._id.toString(),
          stakedAt: (node as any).stakedAt ? (node as any).stakedAt.toISOString() : null,
          registeredAt: (node as any).registeredAt ? (node as any).registeredAt.toISOString() : null
        } 
      };
    }

    return { success: false, message: "NODE_NOT_FOUND" };
    
  } catch (error) {
    console.error("[MESH-BRIDGE] 🚨 Status Scan Fracture:", error);
    return { success: false, message: "VAULT_READ_ERROR" };
  }
=======
export async function registerSecurityCircle(formData: FormData) {
  return { success: true, message: "Registered" };
}

export async function getSecurityCircleStatus(pioneerId: string) {
  return { success: true, data: { stake_amount: 1500 } };
}

export async function getUserStakeTotal(pioneerId: string) {
  return 1500;
}

export async function getNetworkTotalEquity() {
  return { total: 226500 };
>>>>>>> main
}