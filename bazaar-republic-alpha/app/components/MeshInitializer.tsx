"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext"; // 🛡️ CRITICAL: Import global auth

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
  const { pioneer, login } = useAuth(); // 🛡️ PULL BOTH GLOBAL STATE AND LOGIN TRIGGER

  useEffect(() => {
    const initMesh = async () => {
      try {
        // ====================================================================
        // 🛡️ RE-ENTRY SHIELD: Check local cache BEFORE triggering Pi SDK loop
        // ====================================================================
        const cachedUser = localStorage.getItem("pi_auth_user");
        if (cachedUser) {
          const parsedUser = JSON.parse(cachedUser);
          console.log("[MESH-SCAN] Cached Pioneer session detected. Bypassing re-auth loop.");
          
          login({
            uid: parsedUser.uid,
            username: parsedUser.username,
            isAuthenticated: true,
            role: "Pioneer",
            tier: "Alpha",
            trustScore: 100,
            isHydrated: true,
            accessToken: "CACHED_SESSION_TOKEN"
          } as any);

          setIsSyncing(false);
          return; 
        }

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
            const Pi = (window as any).Pi;
            Pi.init({ version: "2.0", sandbox: true });
            
            const authResult = await Pi.authenticate(['username', 'payments'], (payment: any) => {
              console.warn("[MESH-BRIDGE] Incomplete payment detected:", payment);
            });

            const liveUser = { uid: authResult.user.uid, username: authResult.user.username };

            login({
              uid: liveUser.uid,
              username: liveUser.username,
              isAuthenticated: true,
              role: "Pioneer",
              tier: "Alpha",
              trustScore: 100,
              isHydrated: true,
              accessToken: authResult.accessToken
            } as any);
            
            localStorage.setItem("pi_auth_user", JSON.stringify(liveUser));

            await fetch("/api/mesh-seed", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(liveUser),
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
            createPayment: () => {}
          };
        }

        const devUser = { uid: "local_x570_node", username: "PinoyQ8_Dev" };
        
        login({
          uid: devUser.uid,
          username: devUser.username,
          isAuthenticated: true,
          role: "Pioneer",
          tier: "Alpha",
          trustScore: 100,
          isHydrated: true,
          accessToken: "MESH_ALPHA_TOKEN_SECURE"
        } as any);
        
        localStorage.setItem("pi_auth_user", JSON.stringify(devUser));

        await fetch("/api/mesh-seed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(devUser),
        });

      } catch (error) {
        console.error("[MESH-BRIDGE] Initializer Fracture:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    setTimeout(() => initMesh(), 500);
  }, [login]);

  // 🛡️ UNIFIED STATE BRIDGE: Directly derive MeshContext from global AuthContext pioneer state
  const contextValue: MeshContextType = {
    isPiReady: pioneer.isAuthenticated,
    isAuthenticated: pioneer.isAuthenticated,
    accessToken: pioneer.accessToken,
    user: pioneer.uid && pioneer.username ? { uid: pioneer.uid, username: pioneer.username } : null,
  };

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