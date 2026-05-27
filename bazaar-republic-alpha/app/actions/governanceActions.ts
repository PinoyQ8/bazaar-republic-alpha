"use server";

import { connectToLedger } from "@/lib/mongodb";

// ----------------------------------------------------------------------
// 1. 🛡️ MESH-VAULT: Register Node & Lock Stake (Sector 1)
// ----------------------------------------------------------------------
export async function registerSecurityCircle(formData: FormData) {
  const pioneerId = formData.get("pioneerId") as string;
  const publicAddress = formData.get("publicAddress") as string;
  const stakeAmount = parseFloat(formData.get("stakeAmount") as string || "0");
  const TREASURY_WALLET = process.env.DAO_TREASURY_WALLET || "UNCONFIGURED_TREASURY";

  try {
    const db = await connectToLedger();

    // Check Whitelist Bypass
    const isWhitelisted = await db.collection("dao_whitelist").findOne({ pioneerId });

    if (isWhitelisted) {
      await db.collection("security_circles").insertOne({
        pioneerId: pioneerId,
        publicAddress: publicAddress,
        kyc_status: "PASSED",
        is_priority: true,
        enrolled_via: "WHITELIST_BYPASS",
        registeredAt: new Date(),
      });
      return { success: true, message: "BYPASS_SUCCESS: Node Whitelisted." };
    }

    // Bootstrap Validation
    if (stakeAmount < 10.00) {
      return { success: false, message: "STAKE_INSUFFICIENT: 10 Test-Pi Required." };
    }

    const existing = await db.collection("security_circles").findOne({ publicAddress });
    if (existing) return { success: false, message: "WALLET_ALREADY_REGISTERED" };

    // Secure Registration / Lock Stake
    await db.collection("security_circles").insertOne({
      pioneerId: pioneerId,
      publicAddress: publicAddress,
      kyc_status: "BOOTSTRAP_LOCKED",
      is_priority: false,
      stakedAt: new Date(),
      stakeAmount: stakeAmount,
      treasuryDestination: TREASURY_WALLET,
      enrolled_via: "BOOTSTRAP_STAKING",
      registeredAt: new Date(),
    });

    return { 
      success: true, 
      message: "BOOTSTRAP_SUCCESS: 24H Lock Active. Treasury Secured." 
    };

  } catch (error) {
    console.error("[MESH-BRIDGE] 🚨 Governance Registry Fracture:", error);
    return { success: false, message: "VAULT_WRITE_ERROR" };
  }
}

// ----------------------------------------------------------------------
// 2. 🛡️ MESH-SCAN: Node Status Verifier
// ----------------------------------------------------------------------
export async function getSecurityCircleStatus(pioneerId: string) {
  try {
    const db = await connectToLedger();
    
    const node = await db.collection("security_circles").findOne({ pioneerId: pioneerId });

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