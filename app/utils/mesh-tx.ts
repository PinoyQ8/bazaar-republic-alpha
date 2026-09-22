// 🛡️ BAZAAR REPUBLIC // SOVEREIGN MESH TRANSACTION RELAYER
'use client';

export async function executeVaultMutation(
  method: "release" | "refund",
  escrowId: string,
  consumerPubKey: string
): Promise<string> {
  try {
    // Route transaction execution through our secure backend API route
    // which handles the s23-deployer cryptographic signing and Soroban submission.
    const response = await fetch('/api/vault', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: method === "release" ? "RELEASE" : "REFUND",
        escrowId: escrowId.replace(/-/g, '_'),
        consumerAddress: consumerPubKey,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || "On-chain vault mutation rejected.");
    }

    return data.txHash || "SETTLED_ON_CHAIN";
  } catch (error: any) {
    console.error("[MESH-TX Error]:", error.message);
    throw error;
  }
}