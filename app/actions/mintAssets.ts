"use server";

import { revalidatePath } from "next/cache";

export async function executeMintProtocol(amount: string) {
  const PI_API_KEY = process.env.PI_API_KEY; // 🛡️ VAULT KEY
  const PIONEER_UID = process.env.FOUNDER_UID; // 🛡️ YOUR UID

  if (!PI_API_KEY) {
    return { success: false, error: "VAULT_KEY_MISSING" };
  }

  try {
    console.log(`[MESH-UPLINK] Initiating Asset Mint: ${amount} mBZR...`);

    // 🛡️ BRIDGE TO PI PLATFORM API
    const response = await fetch("https://api.minepi.com/v2/payments", {
      method: "POST",
      headers: {
        "Authorization": `Key ${PI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment: {
          amount: parseFloat(amount),
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