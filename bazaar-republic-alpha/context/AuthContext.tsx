"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// 🛡️ THE PIONEER STATE CONTRACT
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

// 🛡️ THE AUTH PROVIDER NODE
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // STATE INITIALIZATION (This resolves the 'setPioneer is not defined' error)
  const [pioneer, setPioneer] = useState<PioneerState>({
    username: undefined,
    tier: undefined,
    isAuthenticated: false,
    isHydrated: false, 
  });

  const login = () => {
    console.log("[MESH-BRIDGE] Explicit login trigger requested.");
  };

  // 🛡️ THE LINEAR MESH BOOT SEQUENCE
  useEffect(() => {
    let isMounted = true; 

    const bootMeshNode = async () => {
      // 1. THE X570 BYPASS PROTOCOL
      if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        console.warn("[MESH-BRIDGE] 🛠️ Localhost detected. Engaging X570 Dev-Bypass.");
        document.cookie = "pioneer_uid=X570-DEV-NODE; path=/; max-age=86400";
        setPioneer({
          isAuthenticated: true,
          uid: "X570-DEV-NODE",
          username: "Bazaar_Founder",
          tier: "ADMIN",
          isHydrated: true
        });
        return;
      }

      // 2. WAIT FOR NATIVE SCRIPT INJECTION 
      let scriptChecks = 0;
      while ((typeof window === "undefined" || !(window as any).Pi) && scriptChecks < 40) {
        await new Promise(resolve => setTimeout(resolve, 250));
        scriptChecks++;
      }

      if (!(window as any).Pi) {
        // Explicitly type 'prev' to resolve TS7006
        if (isMounted) setPioneer((prev: PioneerState) => ({ ...prev, isHydrated: true }));
        console.error("[MESH-FRACTURE] Pi SDK Script never mounted. Are you in the Pi Browser?");
        return;
      }

      const pi = (window as any).Pi;
      const isLiveMainnet = window.location.hostname.includes("project-bazaar-mainnet");
      const useSandbox = !isLiveMainnet;

      // 3. INITIALIZE NATIVE BRIDGE
      if (!(window as any).__PI_INITIALIZED__) {
        try {
          console.log(`[MESH-BRIDGE] 🛰️ Initializing Pi Core (Sandbox: ${useSandbox})...`);
          await pi.init({ version: "2.0", sandbox: useSandbox });
          (window as any).__PI_INITIALIZED__ = true;
          await new Promise(resolve => setTimeout(resolve, 300)); 
        } catch (e) {
          console.warn("[MESH-BRIDGE] ⚠️ SDK Init Warning:", e);
        }
      }

      // 4. THE SINGULAR HANDSHAKE EXECUTION
      try {
        console.log("[MESH-BRIDGE] 🟢 Requesting Pioneer Handshake...");
        
        const authPromise = pi.authenticate(
          ['username', 'payments'], 
          (payment: any) => console.log("Incomplete payment caught:", payment)
        );
        
        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error("MESH-FRACTURE: SDK Authenticate Timeout.")), 15000)
        );

        const auth = await Promise.race([authPromise, timeoutPromise]);

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

// 🛡️ THE MESH HOOK EXPORT
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};