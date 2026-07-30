"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext"; // 🛡️ CRITICAL: Import global auth

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
  const { login } = useAuth(); // 🛡️ PULL THE LOGIN TRIGGER
  
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
        // 🛡️ PHASE 1: LIVE PI BROWSER INTERCEPT
        // ====================================================================
        if (!isLocal) {
          console.log("[MESH-SCAN] Checking for Native Pi SDK...");
          
          let retries = 0;
          const waitForPi = async () => {
            return new Promise<void>((resolve, reject) => {
              const interval = setInterval(() => {
                if (typeof window !== "undefined" && (window as any).Pi) {
                  clearInterval(interval);
                  resolve();
                }
                retries++;
                if (retries >= 30) {
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
            
            Pi.init({ version: "2.0", sandbox: true });
            
            const authResult = await Pi.authenticate(['username', 'payments'], (payment: any) => {
              console.warn("[MESH-BRIDGE] Incomplete payment detected:", payment);
            });

            const liveUser = { uid: authResult.user.uid, username: authResult.user.username };

            // 1. Sync React AuthContext (Stops the redirect loop)
            login({
              uid: liveUser.uid,
              username: liveUser.username,
              isAuthenticated: true,
              role: "Pioneer",
              tier: "Alpha",
              trustScore: 100
            } as any); // 🛡️ TS Override: Forces acceptance of the PioneerState matrix
            
            // 2. Cache it locally
            localStorage.setItem("pi_auth_user", JSON.stringify(liveUser));

            // 3. Seed MongoDB Vault (Required for Fuel Pump)
            await fetch("/api/mesh-seed", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(liveUser),
            });

            setContextValue({
              isPiReady: true,
              isAuthenticated: true,
              accessToken: authResult.accessToken,
              user: liveUser
            });
            
            setIsSyncing(false); 
            return; 

          } catch (err) {
            console.warn("🚨 MESH SHIM: Pi SDK did not load. Falling back to Mock.");
          }
        }

        // ====================================================================
        // 🛡️ PHASE 2: S23 BYPASS / DESKTOP SHIM
        // ====================================================================
        if (typeof window !== "undefined" && !(window as any).Pi) {
          (window as any).Pi = {
            authenticate: async () => ({
              accessToken: "MOCK_PI_ACCESS_TOKEN_2026",
              user: { uid: "local_x570_node", username: "PinoyQ8_Dev" }
            }),
            createPayment: (paymentData: any, callbacks: any) => {
              // ... mock payment logic ...
            }
          };
        }

        const devUser = { uid: "local_x570_node", username: "PinoyQ8_Dev" };
        
        // Sync Dev Node
        login({
          uid: devUser.uid,
          username: devUser.username,
          isAuthenticated: true,
          role: "Pioneer",
          tier: "Alpha",
          trustScore: 100
        } as any); // 🛡️ TS Override
        
        await fetch("/api/mesh-seed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(devUser),
        });

        setContextValue({
          isPiReady: true,
          isAuthenticated: true,
          accessToken: "MESH_ALPHA_TOKEN_SECURE",
          user: devUser
        });

      } catch (error) {
        console.error("[MESH-BRIDGE] Initializer Fracture:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    setTimeout(() => initMesh(), 500);
  }, [login]); // 🛡️ Added login to dependency array

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