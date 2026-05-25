"use server"; // 🛡️ CRITICAL: This ensures the logic stays off the client node

import { revalidatePath } from "next/cache";

export async function verifyPioneerUplink(accessToken: string) {
  try {
    console.log("[MESH-SCAN] Initiating Auth Bridge for token verification...");

    // 🛡️ LEVEL-UP LOGIC: 
    // In a full WASM setup, we would call the Rust binary here.
    // For now, we are bridging the request to the Pi API using the 
    // structural logic we forged in our pi-rust crate.
    
    const response = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`E-Network Rejected Sync: ${response.status}`);
    }

    const data = await response.json();
    
    // 🛡️ Sync complete: Return the verified Pioneer identity
    return {
      success: true,
      pioneer: {
        uid: data.uid,
        username: data.username,
      },
    };

  } catch (error) {
    console.error("[CRITICAL] Bridge Fracture:", error);
    return { success: false, error: "Authentication Shield Failure" };
  }
}