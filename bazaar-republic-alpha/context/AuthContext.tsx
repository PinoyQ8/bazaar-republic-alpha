"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

// 🛡️ SDK INTERFACE DEFINITION
interface PiSDK {
  init: (options: { version: string; sandbox: boolean }) => Promise<void>;
  authenticate: (scopes: string[], onIncompletePayment?: (payment: any) => void) => Promise<{ user: { uid: string; username: string } }>;
}

export type PioneerState = {
  isAuthenticated: boolean;
  uid?: string;
  username?: string;
  tier?: string;
  isHydrated: boolean; 
};

type AuthContextType = {
  pioneer: PioneerState;
  setPioneer: React.Dispatch<React.SetStateAction<PioneerState>>;
  login: () => void;    
  isHydrated: boolean; 
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [pioneer, setPioneer] = useState<PioneerState>({
    username: undefined,
    tier: undefined,
    isAuthenticated: false,
    isHydrated: false, 
  });

  const initialized = useRef(false);

  const login = () => {
    console.log("[MESH-BRIDGE] Explicit login trigger requested.");
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    let isMounted = true; 

    const bootMeshNode = async () => {
      // 1. X570 BYPASS (LOCAL DEV)
      if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        console.warn("[MESH-BRIDGE] 🛠️ Localhost detected. Engaging X570 Dev-Bypass.");
        setPioneer({
          isAuthenticated: true,
          uid: "X570-DEV-NODE",
          username: "Bazaar_Founder",
          tier: "ADMIN",
          isHydrated: true
        });
        return;
      }

      // 2. WAIT FOR NATIVE SCRIPT
      const pi = await new Promise<PiSDK | null>((resolve) => {
        let attempts = 0;
        const interval = setInterval(() => {
          if ((window as any).Pi || attempts > 40) {
            clearInterval(interval);
            resolve((window as any).Pi as PiSDK); // CAST TO INTERFACE
          }
          attempts++;
        }, 250);
      });

      if (!pi) {
        if (isMounted) setPioneer(p => ({ ...p, isHydrated: true }));
        console.error("[MESH-FRACTURE] Pi SDK Script missing.");
        return;
      }

      // 3. SECURE BRIDGE HANDSHAKE
      try {
        console.log("[MESH-BRIDGE] 🛰️ Initializing Pi Core...");
        await pi.init({ version: "2.0", sandbox: true });

        // Buffer for Iframe Origin Settlement
        await new Promise(r => setTimeout(r, 500)); 

        const auth = await pi.authenticate(['username', 'payments']);

        // 🛡️ 4. SELF-HEALING REGISTRY PUSH (NON-BLOCKING)
        try {
          const registryPush = await fetch('/api/mesh/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              username: auth.user.username, 
              uid: auth.user.uid,
              status: 'active' 
            })
          });

          if (registryPush.ok) {
            console.log("[MESH-BRIDGE] 🟢 Identity anchored to ledger.");
          } else {
            console.warn("[MESH-BRIDGE] ⚠️ Ledger anchoring returned non-OK status.");
          }
        } catch (apiError) {
          console.error("[MESH-BRIDGE] 🚨 Registry API unreachable. Node may be isolated.", apiError);
        }

        // 5. LOCK FRONTEND STATE
        if (isMounted) {
          setPioneer({
            isAuthenticated: true,
            uid: auth.user.uid,
            username: auth.user.username,
            tier: "PIONEER",
            isHydrated: true
          });
          console.log(`[MESH-BRIDGE] 🟢 Node Locked: ${auth.user.username}`);
        }
      } catch (error) {
        console.error("[MESH-BRIDGE] 🚨 Authentication Fracture:", error);
        if (isMounted) {
          setPioneer({ 
            isAuthenticated: false, 
            username: "DISCONNECTED_NODE", 
            tier: "NONE",
            isHydrated: true 
          });
        }
      }
    };

    bootMeshNode();
    return () => { isMounted = false; };
  }, []);

  return (
    <AuthContext.Provider value={{ pioneer, setPioneer, login, isHydrated: pioneer.isHydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};