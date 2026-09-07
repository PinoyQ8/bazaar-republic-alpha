const handleGenesisGrant = async () => {
  // 1. Guard against SSR and verify SDK availability
  if (typeof window === "undefined" || !window.Pi) {
    console.error("[BRIDGE-FAILURE] Pi SDK offline or not running inside Pi Browser.");
    return;
  }

  const pi = window.Pi;

  try {
    // 2. Ensure SDK is initialized before triggering payment flow
    await pi.init({
      version: "2.0",
      sandbox: process.env.NODE_ENV !== "production",
    });

    // 3. Payload structured strictly per SDK spec
    const paymentData = {
      amount: 0.05,
      memo: "Alpha Registry Entry: 50 mBZR Genesis Grant",
      metadata: {
        type: "alpha_onboarding",
        reward: 50,
      },
    };

    const callbacks = {
      // Phase I: Server-Side Approval
      onReadyForServerApproval: async (paymentId: string) => {
        console.log("[MESH-SCAN] Payment ID ready for approval:", paymentId);
        try {
          const res = await fetch("/api/payments/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });

          if (!res.ok) {
            throw new Error(`Server approval failed with status ${res.status}`);
          }
          console.log("[MESH-SCAN] Payment approved by server gate.");
        } catch (err) {
          console.error("[BRIDGE-FAILURE] Approval handshake faulted:", err);
        }
      },

      // Phase II/III: Blockchain Settlement & Server Completion
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        console.log("[MESH-SCAN] Blockchain anchored. TxID:", txid);
        try {
          const res = await fetch("/api/payments/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });

          if (!res.ok) {
            throw new Error(`Server completion failed with status ${res.status}`);
          }

          const data = await res.json();
          console.log("[SUCCESS] Payment completed on ledger. Minting verified:", data);
          // Safely update client state or refresh balances here
        } catch (err) {
          console.error("[BRIDGE-FAILURE] Completion handshake faulted:", err);
        }
      },

      // Phase IV: Abort & Error Callbacks
      onCancel: (paymentId: string) => {
        console.warn("[BRIDGE] Payment cancelled by Pioneer. Payment ID:", paymentId);
      },

      onError: (error: Error, payment?: any) => {
        console.error("[BRIDGE-FAILURE] SDK Error encountered:", error, payment);
      },
    };

    // 4. Synchronous SDK dispatch
    pi.createPayment(paymentData, callbacks);
  } catch (err) {
    console.error("[BRIDGE-FAILURE] Payment handshake failed to initialize:", err);
  }
};