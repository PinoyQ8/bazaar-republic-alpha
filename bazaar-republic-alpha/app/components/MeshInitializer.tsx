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
  isAuthenticated: boolean; 
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

  // 🛡️ BAZAAR TECH: Computed Auth State (Eliminates state drift)
  const isAuthenticated = useMemo(() => !!user && !!accessToken, [user, accessToken]);

  useEffect(() => {
    const initializeMesh = async () => {
      // 🛡️ SHADOW AUDIT: The Dev-Node Identity Guardrail
      const isLocalWorkstation = process.env.NODE_ENV === 'development';

      // 🛠️ Isolated Dev Boot Sequence
      const bootDevNode = async () => {
        console.warn("[MESH-OVERRIDE] Local X570 Dev Environment Detected. Injecting Alpha Identity.");
        const devUser = { uid: "DEV_NODE_X570_ALPHA", username: "PinoyQ8" };
        setUser(devUser);
        setAccessToken("LOCAL_DEV_TOKEN_X570");
        setIsPiReady(true);
        await syncPioneerNode(devUser.uid, devUser.username);
      };

      // 🛡️ GATE 1: Check for Pi Browser Environment
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
          if (isLocalWorkstation) {
            await bootDevNode(); // Safe to bypass on X570
          } else {
            // 🚨 Mainnet Security Lock: Drop unauthorized ghosts silently
            console.error("[ADJUDICATOR] Pi SDK Handshake Failed on Mainnet. Access Denied.");
            setIsPiReady(true); // Ready, but strictly unauthenticated.
          }
        }
      } else {
        // No Pi Browser Detected (e.g., standard Chrome)
        if (isLocalWorkstation) {
          await bootDevNode(); // Safe to bypass on X570
        } else {
          console.warn("[MESH-SCAN] No Pi Browser detected. Mainnet Accessor Restricted.");
          setIsPiReady(true); // Ready, but strictly unauthenticated.
        }
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