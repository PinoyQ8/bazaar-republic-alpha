const handleGenesisGrant = async () => {
  try {
    // 🛡️ ADJUDICATOR: Hardened Payment Data Injection
    const paymentData = {
      amount: 0.05,
      memo: "Alpha Registry Entry: 50 mBZR Genesis Grant",
      metadata: { 
        type: "alpha_onboarding", 
        reward: 50 
      },
      // 🛡️ FIX: Mandatory identifier for Pi SDK Ledger Mapping
      identifier: `GENESIS_${Date.now()}` 
    };

    const callbacks = {
      onReadyForServerApproval: async (paymentId: string) => {
        console.log("[MESH-SCAN] Payment ID ready for approval:", paymentId);
        // 🛡️ BAZAAR TECH: Trigger server-side validation here
      },
      onReadyForServerConfirmation: async (paymentId: string) => {
        console.log("[MESH-SCAN] Payment confirmed. Minting 50 mBZR...");
        // 🚀 Finalize the minting logic
      },
      onCancelled: (paymentId: string) => console.log("[BRIDGE] Payment cancelled by Pioneer."),
      onError: (error: Error) => console.error("[BRIDGE-FAILURE] SDK Error:", error),
    };

    // 🛡️ Execute the secure handshake
    await window.Pi.createPayment(paymentData, callbacks);
  } catch (err) {
    console.error("[BRIDGE-FAILURE] Payment handshake failed.", err);
  }
};