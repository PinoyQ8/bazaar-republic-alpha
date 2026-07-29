"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";

interface PioneerIdentity { 
  uid: string; 
  username: string; 
}

interface MeshContextType {
  isPiReady: boolean;
  isAuthenticated: boolean;
  accessToken: string | null; 
  user: PioneerIdentity | null;
}

const MeshContext = createContext<MeshContextType>({ 
  isPiReady: true,
  isAuthenticated: true,
  accessToken: "MESH_ALPHA_TOKEN_SECURE",
  user: { uid: "5f9b3b9b9b9b9b9b9b9b9b9b", username: "PinoyQ8_Dev" },
});

export function MeshInitializer({ children }: { children: React.ReactNode }) {
  const [bypassActive, setBypassActive] = useState(false);

  useEffect(() => {
    const activeHost = typeof window !== "undefined" ? window.location.hostname : "";
    const isTunnelRoute = activeHost.includes('trycloudflare.com') || 
                          activeHost.includes('ngrok-free.app') || 
                          activeHost.includes('localhost') ||
                          activeHost.includes('192.168.');
    
    if (isTunnelRoute) {
      console.warn("🚨 CRITICAL S23 BYPASS: Tunnel/Local detected. Injecting MOCK Pi SDK Shim.");
      
      // 🛡️ MOCK PI SDK SHIM: Prevents 'Pi SDK Not Detected' errors during local testing
      if (typeof window !== "undefined" && !(window as any).Pi) {
        (window as any).Pi = {
          authenticate: async (scopes: string[], onIncompletePaymentFound: Function) => {
            console.log("[MOCK Pi SDK] Authenticate called with scopes:", scopes);
            return {
              accessToken: "MOCK_PI_ACCESS_TOKEN_2026",
              user: { uid: "5f9b3b9b9b9b9b9b9b9b9b9b", username: "PinoyQ8_Dev" }
            };
          },
          createPayment: (paymentData: any, callbacks: any) => {
            console.log("[MOCK Pi SDK] Create Payment intercepted with data:", paymentData);
            
            const activeCallbacks = callbacks || paymentData?.callbacks || paymentData;

            setTimeout(async () => {
              try {
                const mockPaymentId = "MOCK_PAYMENT_ID_999";
                const mockTxid = "MOCK_TXID_999";

                // 1. Trigger Approval Step
                if (activeCallbacks && typeof activeCallbacks.onReadyForServerApproval === 'function') {
                  console.log("[MOCK Pi SDK] Triggering onReadyForServerApproval callback...");
                  // Pass data matching MeshStakeButton expectation (usually { paymentId })
                  await activeCallbacks.onReadyForServerApproval({ paymentId: mockPaymentId });
                }

                // Simulate brief network pause between handshake and completion
                await new Promise(res => setTimeout(res, 800));

                // 2. Trigger Completion Step
                if (activeCallbacks && typeof activeCallbacks.onReadyForServerCompletion === 'function') {
                  console.log("[MOCK Pi SDK] Triggering onReadyForServerCompletion callback...");
                  await activeCallbacks.onReadyForServerCompletion({ paymentId: mockPaymentId, txid: mockTxid });
                }

                console.log("[MOCK Pi SDK] Full payment lifecycle simulation complete.");
              } catch (err) {
                console.error("[MOCK Pi SDK] Lifecycle execution error:", err);
              }
            }, 1000);
          }
        };
      }

      setBypassActive(true);
    }
  }, []);

  const defaultContextValue = useMemo(() => ({
    isPiReady: true,
    isAuthenticated: true,
    accessToken: "MESH_ALPHA_TOKEN_SECURE",
    user: { uid: "5f9b3b9b9b9b9b9b9b9b9b9b", username: "PinoyQ8_Dev" }
  }), []);

  if (bypassActive) {
    return (
      <MeshContext.Provider value={defaultContextValue}>
        <div data-mesh-status="TUNNEL_OVERRIDE" className="w-full h-full contents">
          {children}
        </div>
      </MeshContext.Provider>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 font-mono text-xs text-emerald-500 w-full max-w-[384px] mx-auto border-x border-neutral-800">
      <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <div className="animate-pulse tracking-widest">[MESH-SCAN] SYNCING WORKSPACE MATRIX...</div>
    </div>
  );
}

export const useMeshStatus = () => useContext(MeshContext);