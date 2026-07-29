"use client";

/**
 * 🛡️ MESH PI SDK SHIM (The Viewport Bridge)
 * Auto-detects local S23 testing vs Live Mainnet/Sandbox environments.
 */

export const initiateMeshPayment = async (amount: number, memo: string, pioneerId: string) => {
  
  // 1. 🚨 S23 LOCAL BYPASS (The Development Shim)
  if (typeof window === "undefined" || !(window as any).Pi) {
    console.warn("[MESH-BRIDGE] 🚨 CRITICAL S23 BYPASS: Tunnel/Local detected. Injecting MOCK Pi SDK Shim.");
    
    // Simulate network latency (1.5 seconds)
    await new Promise(res => setTimeout(res, 1500));
    
    console.log(`[MESH-SHIM] Mocking Pi payment of ${amount} for ${memo}`);
    const mockPaymentId = `mock_pay_${Date.now()}`;
    const mockTxid = `mock_txid_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // 🛡️ Ping our local backend to test Phase 1 (Approval)
      await fetch('/api/pi-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', paymentId: mockPaymentId, amount })
      });
      
      // 🛡️ Ping our local backend to test Phase 2 (Completion & DB Yield)
      const completeRes = await fetch('/api/pi-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', paymentId: mockPaymentId, txid: mockTxid, pioneerId, amount })
      });

      return await completeRes.json();
    } catch (err: any) {
      throw new Error(`SHIM_FRACTURE: ${err.message}`);
    }
  }

  // 2. 🌐 LIVE PI NETWORK MAINNET LOGIC
  try {
    return new Promise((resolve, reject) => {
      const Pi = (window as any).Pi;
      
      Pi.createPayment({
        amount,
        memo,
        metadata: { pioneerId },
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("[MESH-BRIDGE] Requesting Treasury Adjudicator Approval...");
          await fetch('/api/pi-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'approve', paymentId, amount }),
          });
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("[MESH-BRIDGE] Payment signed. Requesting Ledger Completion...");
          const res = await fetch('/api/pi-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'complete', paymentId, txid, pioneerId, amount }),
          });
          const data = await res.json();
          resolve(data);
        },
        onCancel: (paymentId: string) => {
          console.warn(`[MESH-BRIDGE] Transaction ${paymentId} aborted by Pioneer.`);
          reject(new Error("PAYMENT_CANCELLED"));
        },
        onError: (error: Error, payment: any) => {
          console.error("[MESH-BRIDGE] Pi SDK Error:", error);
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error("[MESH-BRIDGE] SDK Execution Fracture:", error);
    throw error;
  }
};