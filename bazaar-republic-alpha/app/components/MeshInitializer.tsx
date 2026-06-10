"use client";

import { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";

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
  user: { uid: "DEV_NODE_X570_ALPHA", username: "PinoyQ8" },
});

export function MeshInitializer({ children }: { children: React.ReactNode }) {
  const [bypassActive, setBypassActive] = useState(false);

  useEffect(() => {
    const activeHost = typeof window !== "undefined" ? window.location.hostname : "";
    const isTunnelRoute = activeHost.includes('trycloudflare.com') || activeHost.includes('ngrok-free.app') || activeHost.includes('localhost');
    
    if (isTunnelRoute) {
      console.warn("🚨 CRITICAL S23 BYPASS: Tunnel detected. Forcing instant DOM mount.");
      setBypassActive(true);
    }
  }, []);

  // 🛡️ EMERGENCY INJECTION MATRIX
  const defaultContextValue = useMemo(() => ({
    isPiReady: true,
    isAuthenticated: true,
    accessToken: "MESH_ALPHA_TOKEN_SECURE",
    user: { uid: "DEV_NODE_X570_ALPHA", username: "PinoyQ8" }
  }), []);

  // If we are running over the Cloudflare tunnel, we completely destroy the loader DOM 
  // and force Next.js to render the child layout components instantly.
  if (bypassActive) {
    return (
      <MeshContext.Provider value={defaultContextValue}>
        <div data-mesh-status="TUNNEL_OVERRIDE" className="w-full h-full contents">
          {children}
        </div>
      </MeshContext.Provider>
    );
  }

  // Fallback visual loader for standard non-tunnel browser initializations
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 font-mono text-xs text-amber-500 w-full max-w-[384px] mx-auto border-x border-neutral-800">
      <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <div>[MESH-SCAN] SYNCING WORKSPACE MATRIX...</div>
    </div>
  );
}

export const useMeshStatus = () => useContext(MeshContext);