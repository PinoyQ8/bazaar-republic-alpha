// TARGET FILE PATH: [project-root]/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// 🛡️ THE PIONEER STATE CONTRACT
type PioneerState = {
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

// 🛡️ THE IDENTITY SHIELD
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [pioneer, setPioneer] = useState<PioneerState>({
    username: undefined,
    tier: undefined,
    isAuthenticated: false,
    isHydrated: false, 
  });

  const login = () => {
    console.log("[MESH-BRIDGE] Explicit login trigger requested.");
  };

  useEffect(() => {
    let checkCount = 0;

    const executeAuthChain = async () => {
      try {
        if (typeof window !== "undefined") {
          // 🛡️ 1. THE X570 BYPASS PROTOCOL (Local Development)
          if (window.location.hostname === "localhost") {
            console.warn("[MESH-BRIDGE] 🛠️ Localhost detected. Engaging X570 Dev-Bypass.");
            document.cookie = "pioneer_uid=X570-DEV-NODE; path=/; max-age=86400";
            setPioneer({
              isAuthenticated: true,
              uid: "X570-DEV-NODE",
              username: "Bazaar_Founder",
              tier: "ADMIN",
              isHydrated: true
            });
            return true;
          }

          // 🛡️ 2. THE ALPHA-TRACK MASTER TS BYPASS (Mobile Sandbox)
          if (localStorage.getItem('MASTER_TS')) {
            console.warn("[MESH-BRIDGE] 🛠️ Master TS Token detected. Engaging Alpha-Track Bypass.");
            setPioneer({
              isAuthenticated: true,
              uid: "ALPHA-NODE",
              username: "Alpha_Vanguard",
              tier: "PIONEER",
              isHydrated: true
            });
            return true; // Handshake complete. Skip SDK polling.
          }
        }

        // 🌐 LIVE DEPLOYMENT ASYNCHRONOUS HANDSHAKE
        if (typeof window === "undefined" || !(window as any).Pi) {
          return false; // Not ready yet, retry loop continues
        }

        const pi = (window as any).Pi;
        const isLiveMainnet = window.location.hostname.includes("project-bazaar-mainnet");
        const useSandbox = !isLiveMainnet;

        if (!(window as any).__PI_INITIALIZED__) {
          try {
            console.log(`[MESH-BRIDGE] 🛰️ Initializing Pi Core Core (Sandbox Mode: ${useSandbox})...`);
            await pi.init({ version: "2.0", sandbox: useSandbox });
            (window as any).__PI_INITIALIZED__ = true;
            console.log("[MESH-BRIDGE] 🟢 Pi Core Core State Locked Successfully.");
            await new Promise((resolve) => setTimeout(resolve, 150));
          } catch (initError) {
            console.warn("[MESH-BRIDGE] ⚠️ SDK Init Warning/Inflight Bypass:", initError);
          }
        }

        if (!(window as any).__PI_INITIALIZED__) {
          return false; 
        }

        console.log("[MESH-BRIDGE] 🟢 Requesting Pioneer Handshake...");

        const onIncompletePaymentFound = (payment: any) => {
          console.log("[MESH-BRIDGE] Incomplete payment caught:", payment);
        };

        const authPromise = pi.authenticate(
          ['username', 'payments'], 
          onIncompletePaymentFound
        );

        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error("MESH-FRACTURE: SDK Authenticate Timeout. Native Bridge Dead.")), 15000)
        );

        const auth = await Promise.race([authPromise, timeoutPromise]);

        setPioneer({
          isAuthenticated: true,
          uid: auth.user.uid,
          username: auth.user.username,
          tier: "PIONEER",
          isHydrated: true
        });

        console.log(`[MESH-BRIDGE] 🟢 Node Locked: ${auth.user.username}`);
        return true; 

      } catch (error) {
        console.error("[MESH-BRIDGE] 🚨 Authentication Fracture:", error);
        setPioneer({ 
          isAuthenticated: false, 
          username: "DISCONNECTED_NODE", 
          tier: "NONE",
          isHydrated: true 
        });
        return true; 
      }
    };

    executeAuthChain().then((success) => {
      if (success) return;

      const syncInterval = setInterval(async () => {
        checkCount++;
        const done = await executeAuthChain();
        if (done || checkCount > 20) {
          clearInterval(syncInterval);
          if (checkCount > 20) {
            console.warn("[MESH-BRIDGE] ⚠️ Handshake timeout reached. Decoupling state context.");
            setPioneer(prev => ({ ...prev, isHydrated: true }));
          }
        }
      }, 250);
    });

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