"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// 🛡️ THE PIONEER STATE CONTRACT
type PioneerState = {
  isAuthenticated: boolean;
  uid?: string;
  username?: string;
  tier?: string;
};

type AuthContextType = {
  pioneer: PioneerState;
  setPioneer: React.Dispatch<React.SetStateAction<PioneerState>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🛡️ THE AUTH PROVIDER NODE
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [pioneer, setPioneer] = useState<PioneerState>({
    username: undefined, // Type safe alignment for string | undefined
    tier: undefined,     // Type safe alignment for string | undefined
    isAuthenticated: false,
  });

  useEffect(() => {
    const initializeGlobalAuth = async () => {
      try {
        // 🛡️ THE X570 BYPASS PROTOCOL
        if (typeof window !== "undefined" && window.location.hostname === "localhost") {
          console.warn("[MESH-BRIDGE] 🛠️ Localhost detected. Engaging X570 Dev-Bypass.");
          
          // 🛡️ CRITICAL FIX: Forge the cookie so the Edge Router (proxy.ts) allows the Server Action
          document.cookie = "pioneer_uid=X570-DEV-NODE; path=/; max-age=86400";

          setPioneer({
            isAuthenticated: true,
            uid: "X570-DEV-NODE",
            username: "Bazaar_Founder",
            tier: "ADMIN"
          });
          return; 
        }

        // ----------------------------------------------------------------------
        // 🌐 LIVE DEPLOYMENT LOGIC (This only runs when deployed to Vercel/Pi Browser)
        // ----------------------------------------------------------------------
        if (typeof window === "undefined" || !(window as any).Pi) {
          console.warn("[MESH-BRIDGE] ⚠️ Pi SDK payload not found in live environment.");
          return;
        }

        const pi = (window as any).Pi;

        if (!(window as any).__PI_INITIALIZED__) {
          try {
            pi.init({ version: "2.0", sandbox: true });
            (window as any).__PI_INITIALIZED__ = true; 
            console.log("[MESH-BRIDGE] 🟢 Pi SDK Initialized (Sandbox Node Active).");
          } catch (initError) {
            console.warn("[MESH-BRIDGE] ⚠️ SDK Init Warning:", initError);
          }
        }

        console.log("[MESH-BRIDGE] 🟢 Requesting Pioneer Handshake...");

        const onIncompletePaymentFound = (payment: any) => {
          console.log("Incomplete payment caught:", payment);
        };

        const auth = await pi.authenticate(
          ['username', 'payments', 'wallet_address'],
          onIncompletePaymentFound
        );

        setPioneer({
          isAuthenticated: true,
          uid: auth.user.uid,
          username: auth.user.username,
          tier: "PIONEER"
        });
        
        console.log(`[MESH-BRIDGE] 🟢 Node Locked: ${auth.user.username}`);

      } catch (error) {
        console.error("[MESH-BRIDGE] 🚨 Authentication Fracture:", error);
        setPioneer({ 
          isAuthenticated: false, 
          username: "DISCONNECTED_NODE", 
          tier: "NONE" 
        });
      }
    };

    initializeGlobalAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ pioneer, setPioneer }}>
      {children}
    </AuthContext.Provider>
  );
}

// 🛡️ THE MESH HOOK
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};