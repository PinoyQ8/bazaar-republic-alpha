"use client";

import { createContext, useContext, useEffect, useState } from "react";

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
  isPiReady: false,
  isAuthenticated: false,
  accessToken: null,
  user: null,
});

export function MeshInitializer({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(true);
  const [contextValue, setContextValue] = useState<MeshContextType>({
    isPiReady: false,
    isAuthenticated: false,
    accessToken: null,
    user: null
  });

  useEffect(() => {
    const initMesh = async () => {
      try {
        const activeHost = typeof window !== "undefined" ? window.location.hostname : "";
        const isLocal = activeHost.includes('localhost') || activeHost.includes('192.168.');

        // ====================================================================
        // 🛡️ PHASE 1: LIVE PI BROWSER INTERCEPT (POLLING MATRIX)
        // ====================================================================
        if (!isLocal) {
          console.log("[MESH-SCAN] Checking for Native Pi SDK...");
          
          // Poll for the SDK (Max 3 seconds)
          let retries = 0;
          const maxRetries = 30; // 30 * 100ms = 3 seconds max wait
          
          const waitForPi = async () => {
            return new Promise<void>((resolve, reject) => {
              const interval = setInterval(() => {
                if (typeof window !== "undefined" && (window as any).Pi) {
                  clearInterval(interval);
                  resolve();
                }
                retries++;
                if (retries >= maxRetries) {
                  clearInterval(interval);
                  reject(new Error("Pi SDK timeout"));
                }
              }, 100);
            });
          };

          try {
            await waitForPi();
            console.log("[MESH-SCAN] Native Pi SDK detected. Initiating True Handshake.");
            const Pi = (window as any).Pi;
            
            // ⚠️ IGNITION SEQUENCE
            Pi.init({ version: "2.0", sandbox: true });
            
            // ⚠️ AUTHENTICATION
            const authResult = await Pi.authenticate(['username', 'payments'], (payment: any) => {
              console.warn("[MESH-BRIDGE] Incomplete payment detected:", payment);
            });

            setContextValue({
              isPiReady: true,
              isAuthenticated: true,
              accessToken: authResult.accessToken,
              user: { uid: authResult.user.uid, username: authResult.user.username }
            });
            setIsSyncing(false); // Kill spinner
            return; // Escape hatch: Handshake complete!

          } catch (err) {
            console.warn("🚨 MESH SHIM: Pi SDK did not load in time. Falling back to Mock.");
            // If it fails, it will naturally fall down to Phase 2 (the Shim)
          }
        }

        // ====================================================================
        // 🛡️ PHASE 2: S23 BYPASS / DESKTOP SHIM
        // ====================================================================
        console.warn("🚨 MESH SHIM: Pi SDK missing or Local Node. Injecting X570 Mock.");
        
        if (typeof window !== "undefined" && !(window as any).Pi) {
          (window as any).Pi = {
            authenticate: async () => ({
              accessToken: "MOCK_PI_ACCESS_TOKEN_2026",
              user: { uid: "local_x570_node", username: "PinoyQ8_Dev" }
            }),
            createPayment: (paymentData: any, callbacks: any) => {
              console.log("[MOCK Pi SDK] Create Payment intercepted:", paymentData);
              const activeCallbacks = callbacks || paymentData?.callbacks || paymentData;

              setTimeout(async () => {
                try {
                  const mockPaymentId = `MOCK_PAY_${Date.now()}`;
                  const mockTxid = `TXID_${Math.random().toString(36).substr(2, 9)}`;

                  if (activeCallbacks?.onReadyForServerApproval) {
                    await activeCallbacks.onReadyForServerApproval({ paymentId: mockPaymentId });
                  }
                  await new Promise(res => setTimeout(res, 800));
                  
                  if (activeCallbacks?.onReadyForServerCompletion) {
                    await activeCallbacks.onReadyForServerCompletion({ paymentId: mockPaymentId, txid: mockTxid });
                  }
                } catch (err) {
                  console.error("[MOCK Pi SDK] Lifecycle fracture:", err);
                }
              }, 1000);
            }
          };
        }

        // Lock in the Dev Identity
        setContextValue({
          isPiReady: true,
          isAuthenticated: true,
          accessToken: "MESH_ALPHA_TOKEN_SECURE",
          user: { uid: "local_x570_node", username: "PinoyQ8_Dev" }
        });

      } catch (error) {
        console.error("[MESH-BRIDGE] Initializer Fracture:", error);
      } finally {
        // 🛡️ THE FAILSAFE: This guarantees the spinner dies no matter what.
        setIsSyncing(false);
      }
    };

    // 500ms Buffer: Allows the external Pi SDK script to mount before checking
    setTimeout(() => initMesh(), 500);
  }, []);

  if (isSyncing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 font-mono text-xs text-emerald-500 w-full max-w-[384px] mx-auto border-x border-neutral-800">
        <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="animate-pulse tracking-widest">[MESH-SCAN] SYNCING WORKSPACE MATRIX...</div>
      </div>
    );
  }

  return (
    <MeshContext.Provider value={contextValue}>
      <div data-mesh-status={contextValue.user?.username === 'PinoyQ8_Dev' ? "TUNNEL_OVERRIDE" : "LIVE_MAINNET"} className="w-full h-full contents">
        {children}
      </div>
    </MeshContext.Provider>
  );
}

export const useMeshStatus = () => useContext(MeshContext);