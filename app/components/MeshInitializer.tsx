"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext"; 
import { Loader2 } from "lucide-react";

// Declare window.Pi for TypeScript safety
declare global {
  interface Window {
    Pi: any;
  }
}

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
  const { pioneer, login } = useAuth(); 
  
  // 🛡️ Guard against React Strict Mode double-firing the initialization
  const initAttempted = useRef(false);

  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    const initMesh = async () => {
      try {
        // ====================================================================
        // 🛡️ CRITICAL FIX: Initialize Pi SDK Globally in Sandbox Mode
        // ====================================================================
        if (typeof window !== "undefined" && window.Pi) {
          try {
            window.Pi.init({ version: "2.0", sandbox: true });
            console.log("[MESH-SCAN] Pi SDK Successfully Initialized (Sandbox Mode).");
          } catch (sdkError) {
            console.warn("[MESH-SCAN] Pi.init() warning or already initialized:", sdkError);
          }
        }

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
            status: parsedUser.status || "ACTIVE", 
            trustScore: parsedUser.trustScore || 100,
            isHydrated: true,
            accessToken: parsedUser.accessToken || "CACHED_SESSION_TOKEN"
          } as any);

          setIsSyncing(false);
          return; 
        }

        console.log("[MESH-SCAN] No cache found. Genesis Shield Active.");

      } catch (error) {
        console.error("[MESH-BRIDGE] Initializer Fracture:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    // Minimal delay to allow UI to lock before async logic
    setTimeout(() => initMesh(), 300);
  }, [login]);

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