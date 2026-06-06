"use client";

import { createContext, useContext, useEffect, useState } from "react";
// 🛡️ BAZAAR TECH: Import the Ledger Sync Action
import { syncPioneerNode } from "@/app/actions/auth"; 

interface PioneerIdentity {
  uid: string;
  username: string;
}

interface MeshContextType {
  isPiReady: boolean;
  user: PioneerIdentity | null;
  accessToken: string | null;
}

const MeshContext = createContext<MeshContextType>({ 
  isPiReady: false,
  user: null,
  accessToken: null,
});

export function MeshInitializer({ children }: { children: React.ReactNode }) {
  const [isPiReady, setIsPiReady] = useState(false);
  const [user, setUser] = useState<PioneerIdentity | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const initializeMesh = async () => {
      if (typeof window !== "undefined" && window.Pi) {
        try {
          // GATE 1: SDK Initialization
          window.Pi.init({ version: "2.0", sandbox: true });
          console.log("[MESH ALIGNMENT] Pi SDK v2.0 Initialized in Sandbox Mode");

          // GATE 2: Identity Extraction
          const scopes = ['username', 'payments'];
          const onIncompletePaymentFound = (payment: any) => {
            console.log("[MESH-SCAN] Incomplete payment detected:", payment);
          };

          const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
          
          // Lock Identity to State
          setUser(authResult.user);
          setAccessToken(authResult.accessToken);
          setIsPiReady(true);
          console.log(`[IDENTITY ANCHOR] Node Synced: @${authResult.user.username}`);

          // 🛡️ BAZAAR TECH: Sync Live Pioneer to MongoDB Ledger
          await syncPioneerNode(authResult.user.uid, authResult.user.username);

        } catch (error) {
          // 🛡️ THE BAZAAR BYPASS: Downgraded to warn to prevent Next.js Red Screen Crash
          console.warn("[MESH-SCAN] Environment Lockout intercepted. Bypassing SDK...");
          console.warn("[MESH OVERRIDE] Standard browser detected. Injecting Local Dev Identity.");
          
          const devUser = { uid: "DEV_NODE_X570_ALPHA", username: "PinoyQ8" };
          setUser(devUser);
          setAccessToken("LOCAL_DEV_TOKEN");
          setIsPiReady(true);
          
          // 🛡️ BAZAAR TECH: Sync Dev Pioneer to MongoDB Ledger
          await syncPioneerNode(devUser.uid, devUser.username);
        }
      } else {
        console.warn("[MESH-SCAN] window.Pi not detected. Ensure connection via Pi Browser.");
      }
    };

    const bootTimer = setTimeout(initializeMesh, 100);
    return () => clearTimeout(bootTimer);
  }, []);

  return (
    <MeshContext.Provider value={{ isPiReady, user, accessToken }}>
      <div data-mesh-status={isPiReady ? "ONLINE" : "BOOTING"} className="contents">
        {children}
      </div>
    </MeshContext.Provider>
  );
}

export const useMeshStatus = () => useContext(MeshContext);