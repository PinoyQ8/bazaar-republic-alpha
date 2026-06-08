"use client";

import { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { syncPioneerNode } from "@/app/actions/auth";

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

// 🛡️ ADJUDICATOR: Hardened Context Default Value
const MeshContext = createContext<MeshContextType>({ 
  isPiReady: false,
  isAuthenticated: false,
  accessToken: null,
  user: null,
});

export function MeshInitializer({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PioneerIdentity | null>(null);
  const [isPiReady, setIsPiReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  const hasSynced = useRef(false);
  const isAuthenticated = useMemo(() => !!user, [user]);

  useEffect(() => {
    if (hasSynced.current) return;

    const isDev = process.env.NODE_ENV === 'development';

    const performSync = async (node: PioneerIdentity) => {
      try {
        await syncPioneerNode(node.uid, node.username);
        hasSynced.current = true;
        setUser(node);
        // 🛡️ BAZAAR TECH: Placeholder for token acquisition logic
        setAccessToken("MESH_ALPHA_TOKEN_SECURE"); 
        console.log(`[IDENTITY ANCHOR] Successfully Synced: @${node.username}`);
      } catch (e) {
        console.error("[ADJUDICATOR] Critical Sync Failure:", e);
      }
    };

    const attemptHandshake = async () => {
      try {
        window.Pi.init({ version: "2.0", sandbox: true });
        const auth = await window.Pi.authenticate(['username']);
        await performSync(auth.user);
      } catch (e) {
        if (isDev) {
          console.warn("[MESH-OVERRIDE] SDK Auth failed, injecting Alpha Dev Node.");
          await performSync({ uid: "DEV_NODE_X570_ALPHA", username: "PinoyQ8" });
        } else {
          console.error("[MESH FRACTURE] Native Authentication failed.", e);
        }
      }
    };

    const initializeMesh = () => {
      if (typeof window !== "undefined" && window.Pi) {
        attemptHandshake().finally(() => setIsPiReady(true));
      } else if (isDev) {
        performSync({ uid: "DEV_NODE_X570_ALPHA", username: "PinoyQ8" })
          .finally(() => setIsPiReady(true));
      } else {
        console.error("[MESH FRACTURE] Pi SDK not detected.");
        setIsPiReady(true);
      }
    };

    const bufferTimer = setTimeout(initializeMesh, 500);
    return () => clearTimeout(bufferTimer);
  }, []);

  // 🛡️ HARDENED PROVIDER VALUE: Contract Compliance
  const contextValue = useMemo(() => ({
    isPiReady,
    isAuthenticated,
    accessToken,
    user
  }), [isPiReady, isAuthenticated, accessToken, user]);

  return (
    <MeshContext.Provider value={contextValue}>
      <div data-mesh-status={isPiReady ? "ONLINE" : "BOOTING"} className="contents">
        {children}
      </div>
    </MeshContext.Provider>
  );
}

export const useMeshStatus = () => useContext(MeshContext);