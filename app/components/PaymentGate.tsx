const handleGenesisGrant = async () => {
  try {
    const paymentData = {
      amount: 0.05,
      memo: "Alpha Registry Entry: 50 mBZR Genesis Grant",
      metadata: { type: "alpha_onboarding", reward: 50 },
    };

    const callbacks = {
      onReadyForServerApproval: (paymentId: string) => {
        /* 🛡️ Logic to approve on your backend */
        console.log("[MESH-SCAN] Payment ID ready for approval:", paymentId);
      },
      onReadyForServerConfirmation: (paymentId: string) => {
        /* 🚀 Finalize the 50 mBZR minting */
        console.log("[MESH-SCAN] Payment confirmed. Minting 50 mBZR...");
      },
      onCancelled: (paymentId: string) => console.log("Payment Cancelled."),
      onError: (error: Error) => console.error("Bridge Error:", error),
    };

    await window.Pi.createPayment(paymentData, callbacks);
  } catch (err) {
    console.error("[BRIDGE-FAILURE] Payment handshake failed.");
  }
};