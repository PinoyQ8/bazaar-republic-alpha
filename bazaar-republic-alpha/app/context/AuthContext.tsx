"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// 🛡️ THE PIONEER STATE CONTRACT
type PioneerState = {
  isAuthenticated: boolean;
  uid?: string;
  username?: string;
  tier?: string;
  isHydrated: boolean; // 🟢 Hard-coded to fix page.tsx interface compilation
};

type AuthContextType = {
  pioneer: PioneerState;
  setPioneer: React.Dispatch<React.SetStateAction<PioneerState>>;
  login: () => void;   // 🟢 Added to fulfill implicit type calls in RepublicHeroSector
  isHydrated: boolean; // 🟢 Added top-level for simple destructured access
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🛡️ THE AUTH PROVIDER NODE
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [pioneer, setPioneer] = useState<PioneerState>({
    username: undefined,
    tier: undefined,
    isAuthenticated: false,
    isHydrated: false, // Starts unhydrated to protect layout rendering
  });

  const login = () => {
    console.log("[MESH-BRIDGE] Explicit login trigger requested.");
  };

  useEffect(() => {
    let checkCount = 0;

    const executeAuthChain = async () => {
      try {
        // 🛡️ THE X570 BYPASS PROTOCOL
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
          return true; // Handshake complete
        }

        // 🌐 LIVE DEPLOYMENT ASYNCHRONOUS HANDSHAKE
        if (typeof window === "undefined" || !(window as any).Pi) {
          return false; // Not ready yet, keep polling
        }

        const pi = (window as any).Pi;

        // DYNAMIC SANDBOX AUTO-DETECTION
        // If running on Vercel deployment strings, sandbox remains true. If on mainnet app, drops to false.
        const isLiveMainnet = window.location.hostname.includes("project-bazaar-mainnet");
        const useSandbox = !isLiveMainnet;

        // 🛡️ FORCE PRODUCTION MATRIX FOR MAINNET DEPLOYMENT
if (!(window as any).__PI_INITIALIZED__) {
  try {
    // Hard-coding sandbox: false to align perfectly with the native production log trace
    pi.init({ version: "2.0", sandbox: false });
    (window as any).__PI_INITIALIZED__ = true; 
    console.log("[MESH-BRIDGE] 🟢 Pi SDK Hard-Locked to Production Mainnet Layer.");
  } catch (initError) {
    console.warn("[MESH-BRIDGE] ⚠️ SDK Init Warning:", initError);
  }
}

        console.log("[MESH-BRIDGE] 🟢 Requesting Pioneer Handshake...");

        const onIncompletePaymentFound = (payment: any) => {
          console.log("[MESH-BRIDGE] Incomplete payment caught:", payment);
        };

        const auth = await pi.authenticate(
          ['username', 'payments', 'wallet_address'],
          onIncompletePaymentFound
        );

        setPioneer({
          isAuthenticated: true,
          uid: auth.user.uid,
          username: auth.user.username,
          tier: "PIONEER",
          isHydrated: true
        });
        
        console.log(`[MESH-BRIDGE] 🟢 Node Locked: ${auth.user.username}`);
        return true; // Successfully authenticated

      } catch (error) {
        console.error("[MESH-BRIDGE] 🚨 Authentication Fracture:", error);
        setPioneer({ 
          isAuthenticated: false, 
          username: "DISCONNECTED_NODE", 
          tier: "NONE",
          isHydrated: true // Release the loader even on failure so error screen shows
        });
        return true; // Stop loop on true logical error
      }
    };

    // Initialize immediate execution attempt
    executeAuthChain().then((success) => {
      if (success) return;

      // 🛡️ RETRY LOOP: If script wasn't ready, poll until active connection made
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

// 🛡️ THE MESH HOOK
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};