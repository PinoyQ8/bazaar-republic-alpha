"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 🛡️ TS SHIELD ALIGNED: The global Window interface is handled natively by your app/types/global.d.ts
// Redundant 'any' declaration has been purged to maintain strict type purity.

interface PioneerTelemetry {
  uid: string;
  username: string;
}

interface PiAuthContextType {
  pioneer: PioneerTelemetry | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  authenticateNode: () => Promise<void>;
  authError: string | null;
}

const PiAuthContext = createContext<PiAuthContextType | undefined>(undefined);

export function PiAuthBridge({ children }: { children: ReactNode }) {
  const [pioneer, setPioneer] = useState<PioneerTelemetry | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // 🛡️ MESH POLL: Wait for the Next.js script to fully mount the Pi object
  useEffect(() => {
    const initPiNode = () => {
      if (typeof window !== 'undefined' && window.Pi) {
        // We initialize in Sandbox mode for local routing. 
        // This MUST be flipped to false before Mainnet deployment.
        window.Pi.init({ version: "2.0", sandbox: true });
        console.log("[MESH-BRIDGE]: Pi SDK Initialized // Sandbox Active");
      } else {
        setTimeout(initPiNode, 500);
      }
    };
    initPiNode();
  }, []);

  // 🛡️ CRYPTOGRAPHIC HANDSHAKE
  const authenticateNode = async () => {
    setAuthError(null);
    try {
      const scopes = ['username'];
      const onIncompletePaymentFound = (payment: any) => {
        console.log("[MESH-LEDGER]: Incomplete payment detected", payment);
      };

      const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      
      setPioneer({
        uid: authResult.user.uid,
        username: authResult.user.username,
      });
      setAccessToken(authResult.accessToken);
      
      console.log("[MESH-BRIDGE]: Authentication successful. Pioneer UID secured.");
    } catch (error: any) {
      console.error("[MESH-FRACTURE]: Pi Auth failed", error);
      setAuthError("Failed to handshake with Pi Core Servers. Ensure you are using the Pi Browser or Sandbox environment.");
    }
  };

  return (
    <PiAuthContext.Provider value={{ 
      pioneer, 
      accessToken, 
      isAuthenticated: !!pioneer, 
      authenticateNode, 
      authError 
    }}>
      {children}
    </PiAuthContext.Provider>
  );
}

// 🛡️ HOOK EXPORT: For rapid ingestion by other MESH modules
export const usePiAuth = () => {
  const context = useContext(PiAuthContext);
  if (context === undefined) {
    throw new Error("usePiAuth must be used within a PiAuthBridge");
  }
  return context;
};