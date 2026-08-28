"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function executeMintProtocol(amount: string) {
  const PI_API_KEY = process.env.PI_API_KEY; // 🛡️ VAULT KEY
  const PIONEER_UID = process.env.FOUNDER_UID; // 🛡️ YOUR UID

  if (!PI_API_KEY) {
    return { success: false, error: "VAULT_KEY_MISSING" };
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return { success: false, error: "INVALID_AMOUNT" };
  }

  try {
    console.log(`[MESH-UPLINK] Initiating Asset Mint: ${numericAmount} mBZR...`);

    // 🛡️ 1. ENFORCE 1K CAP IN LOCAL MESH LEDGER
    if (PIONEER_UID) {
      const node = await prisma.pioneerNode.findUnique({
        where: { uid: PIONEER_UID },
      });

      if (node) {
        const LIFETIME_CAP = 1000;
        if ((node.mintedPiTotal || 0) + numericAmount > LIFETIME_CAP) {
          return { success: false, error: "CAP_EXCEEDED: 1,000 Pi Lifetime Limit Reached" };
        }
      }
    }

    // 🛡️ 2. BRIDGE TO PI PLATFORM API (A2U PAYMENT)
    const response = await fetch("https://api.minepi.com/v2/payments", {
      method: "POST",
      headers: {
        "Authorization": `Key ${PI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment: {
          amount: numericAmount,
          memo: "mBZR_MINT_GENESIS",
          metadata: { type: "MINT", sector: "VAULT_ADMIN" },
          uid: PIONEER_UID,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "E-NETWORK_REJECTION");
    }

    // 🛡️ 3. UPDATE LOCAL MESH LEDGER ON SUCCESSFUL API RESPONSE
    if (PIONEER_UID) {
      await prisma.pioneerNode.update({
        where: { uid: PIONEER_UID },
        data: {
          mintedPiTotal: { increment: numericAmount },
          mbzrBalance: { increment: numericAmount },
          lastActivityTimestamp: new Date(),
        },
      });
    }

    // 🛡️ SYNC COMPLETE
    revalidatePath("/academy");
    return { 
      success: true, 
      txId: data.identifier, 
      message: "mBZR ASSET MINTED TO TREASURY" 
    };

  } catch (error: any) {
    console.error("[CRITICAL] Vault Fracture:", error.message);
    return { success: false, error: error.message };
  }
}