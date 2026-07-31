"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext"; // 🛡️ GLOBAL AUTH ANCHOR
import { Loader2 } from "lucide-react";

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
  const { pioneer, login } = useAuth(); // 🛡️ PULL GLOBAL STATE

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
            tier: parsedUser.tier || "CITIZEN",
            status: parsedUser.status || "ACTIVE", // Schema v2.3 NodeStatus
            trustScore: parsedUser.trustScore || 100,
            isHydrated: true,
            accessToken: "CACHED_SESSION_TOKEN"
          } as any);

          setIsSyncing(false);
          return; 
        }

        const activeHost = typeof window !== "undefined" ? window.location.hostname : "";
        const isLocal = activeHost.includes('localhost') || activeHost.includes('192.168.');

        let activeAccessToken = "";
        let liveUser = { uid: "", username: "" };

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
            Pi.init({ version: "2.0", sandbox: process.env.NODE_ENV !== 'production' });
            
            const authResult = await Pi.authenticate(['username', 'payments'], (payment: any) => {
              console.warn("[MESH-BRIDGE] Incomplete payment detected:", payment);
            });

            activeAccessToken = authResult.accessToken;
          } catch (err) {
            console.warn("🚨 MESH SHIM: Pi SDK did not load. Falling back to Mock.");
          }
        }

        // ====================================================================
        // 🛡️ PHASE 2: S23 BYPASS / X570 DESKTOP SHIM
        // ====================================================================
        if (!activeAccessToken) {
          console.log("[MESH-SCAN] Activating Local X570 Shim Protocol...");
          activeAccessToken = "MOCK_PI_ACCESS_TOKEN_2026";
        }

        // ====================================================================
        // 🛡️ PHASE 3: SCHEMA v2.3 DATABASE SYNC (/api/auth/pi-verify)
        // ====================================================================
        const res = await fetch("/api/auth/pi-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: activeAccessToken }),
        });

        if (!res.ok) throw new Error("Backend Bridge Sync Failed");

        const dbRecord = await res.json();
        
        liveUser = { 
          uid: dbRecord.uid, 
          username: dbRecord.username 
        };
        
        // Push the DB confirmed stats into the Global Auth Context
        login({
          uid: liveUser.uid,
          username: liveUser.username,
          isAuthenticated: true,
          role: "Pioneer",
          tier: dbRecord.tier || "CITIZEN",
          status: dbRecord.status || "SYNCING",
          trustScore: 100,
          isHydrated: true,
          accessToken: activeAccessToken
        } as any);
        
        // Cache the result to bypass the loop on next render
        localStorage.setItem("pi_auth_user", JSON.stringify({
          ...liveUser,
          tier: dbRecord.tier,
          status: dbRecord.status,
          trustScore: 100
        }));

      } catch (error) {
        console.error("[MESH-BRIDGE] Initializer Fracture:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    // Minimal delay to allow UI to lock before heavy async logic
    setTimeout(() => initMesh(), 300);
  }, [login]);

  // 🛡️ UNIFIED STATE BRIDGE: Link MeshContext to global AuthContext pioneer state
  const contextValue: MeshContextType = {
    isPiReady: pioneer.isAuthenticated,
    isAuthenticated: pioneer.isAuthenticated,
    accessToken: pioneer.accessToken,
    user: pioneer.uid && pioneer.username ? { uid: pioneer.uid, username: pioneer.username } : null,
  };

  if (isSyncing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 font-mono text-xs text-cyan-500 w-full max-w-[384px] mx-auto">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <div className="animate-pulse tracking-widest font-bold">
          [MESH-SCAN] SYNCING MATRIX...
        </div>
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