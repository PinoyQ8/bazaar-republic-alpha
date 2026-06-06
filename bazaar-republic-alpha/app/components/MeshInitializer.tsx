"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
// 🛡️ BAZAAR TECH: Ledger Sync Action
import { syncPioneerNode } from "@/app/actions/auth"; 

interface PioneerIdentity {
  uid: string;
  username: string;
}

interface MeshContextType {
  isPiReady: boolean;
  isAuthenticated: boolean; // 🛡️ CRITICAL: Access flag
  user: PioneerIdentity | null;
  accessToken: string | null;
}

const MeshContext = createContext<MeshContextType>({ 
  isPiReady: false,
  isAuthenticated: false, // Default: Zero Trust
  user: null,
  accessToken: null,
});

export function MeshInitializer({ children }: { children: React.ReactNode }) {
  const [isPiReady, setIsPiReady] = useState(false);
  const [user, setUser] = useState<PioneerIdentity | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // 🛡️ BAZAAR TECH: Computed Auth State
  // This eliminates the risk of state drift. If user exists, MESH is open.
  const isAuthenticated = useMemo(() => !!user && !!accessToken, [user, accessToken]);

  useEffect(() => {
    const initializeMesh = async () => {
      // 🛡️ GATE 1: Environment Check
      if (typeof window !== "undefined" && window.Pi) {
        try {
          window.Pi.init({ version: "2.0", sandbox: true });
          
          const scopes = ['username', 'payments'];
          const authResult = await window.Pi.authenticate(scopes, 
             (payment: any) => console.log("[MESH-SCAN] Incomplete payment found:", payment)
          );
          
          setUser(authResult.user);
          setAccessToken(authResult.accessToken);
          setIsPiReady(true);

          await syncPioneerNode(authResult.user.uid, authResult.user.username);
          console.log(`[IDENTITY ANCHOR] Synced: @${authResult.user.username}`);

        } catch (error) {
          // 🛡️ THE BAZAAR BYPASS: Local Dev Overrides
          console.warn("[MESH-OVERRIDE] SDK Fracture. Injecting Local Dev Identity.");
          const devUser = { uid: "DEV_NODE_X570_ALPHA", username: "PinoyQ8" };
          setUser(devUser);
          setAccessToken("LOCAL_DEV_TOKEN");
          setIsPiReady(true);
          await syncPioneerNode(devUser.uid, devUser.username);
        }
      } else {
        console.warn("[MESH-SCAN] No Pi Browser detected. Accessor Restricted.");
        setIsPiReady(true); // Allow UI to render the "Connect" Gate
      }
    };

    const bootTimer = setTimeout(initializeMesh, 100);
    return () => clearTimeout(bootTimer);
  }, []);

  return (
    <MeshContext.Provider value={{ isPiReady, isAuthenticated, user, accessToken }}>
      <div data-mesh-status={isPiReady ? "ONLINE" : "BOOTING"} className="contents">
        {children}
      </div>
    </MeshContext.Provider>
  );
}

export const useMeshStatus = () => useContext(MeshContext);