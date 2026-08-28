"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  const [sdkReady, setSdkReady] = useState(false);

  // 🛡️ MESH POLL: Detect Pi Browser SDK injection with a hard retry limit
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds total pool window

    const checkPiSdk = () => {
      if (typeof window !== 'undefined' && window.Pi) {
        try {
          const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
          const useSandbox = isProduction ? false : (process.env.NEXT_PUBLIC_PI_SANDBOX === 'true');

          window.Pi.init({ version: "2.0", sandbox: useSandbox });
          setSdkReady(true);
          console.log(`[MESH-BRIDGE]: Pi SDK Native Injection Verified // Sandbox: ${useSandbox}`);
        } catch (initErr) {
          console.error("[MESH-BRIDGE]: Pi.init() failed", initErr);
        }
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkPiSdk, 500);
      } else {
        console.warn("[MESH-BRIDGE]: Pi SDK not detected. Ensure app is opened inside the Pi Browser.");
        setAuthError("Pi SDK not detected. Please open this node inside the official Pi Browser.");
      }
    };

    checkPiSdk();
  }, []);

  // 🛡️ CRYPTOGRAPHIC HANDSHAKE WITH ROBUST TIMEOUT & FALLBACK
  const authenticateNode = async () => {
    setAuthError(null);
    try {
      if (!window.Pi) {
        throw new Error("Pi SDK injection missing. Please reload inside the Pi Browser.");
      }

      const scopes = ['username', 'payments', 'wallet_address'];
      const onIncompletePaymentFound = (payment: any) => {
        console.log("[MESH-LEDGER]: Incomplete payment detected", payment);
      };

      console.log("[MESH-BRIDGE]: Requesting Pi Browser authentication window...");

      // 15-Second Hard Boundary Promise Race to prevent infinite mobile hangs
      const authPromise = window.Pi.authenticate(scopes, onIncompletePaymentFound);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Pi Browser SDK Handshake Timed Out. Please retry.')), 15000)
      );

      const authResult: any = await Promise.race([authPromise, timeoutPromise]);
      
      if (!authResult?.accessToken) {
        throw new Error('PI_AUTH_EMPTY_TOKEN: Failed to retrieve access token from Pi Core.');
      }

      console.log("[MESH-BRIDGE]: Pi token secured. Synchronizing with MongoDB Atlas...");

      // Send token to backend to atomically upsert user node
      const verifyRes = await fetch('/api/auth/pi-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: authResult.accessToken }),
      });

      const data = await verifyRes.json();

      if (!verifyRes.ok || !data.success) {
        throw new Error(data.error || data.details || 'Database write verification failed.');
      }

      setPioneer({
        uid: data.uid || authResult.user.uid,
        username: data.username || authResult.user.username,
      });
      setAccessToken(authResult.accessToken);
      
      localStorage.setItem('pi_access_token', authResult.accessToken);
      localStorage.setItem('mesh_pioneer_uid', data.uid || authResult.user.uid);

      console.log("[MESH-BRIDGE]: Mobile Node successfully synchronized with MESH.");
    } catch (error: any) {
      console.error("[MESH-FRACTURE]: Authentication Fault:", error);
      setAuthError(error.message || "Authentication failed. Please check your network and try again.");
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

export const usePiAuth = () => {
  const context = useContext(PiAuthContext);
  if (context === undefined) {
    throw new Error("usePiAuth must be used within a PiAuthBridge");
  }
  return context;
};