// Route: /app/components/auth/pioneer-auth.tsx
// Logic: E-Network Entry Gate & SDK Handshake (MESH Hardened)

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PioneerData {
  uid: string;
  username: string;
  accessToken?: string;
}

export default function PioneerAuth() {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [pioneer, setPioneer] = useState<PioneerData | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let checkCount = 0;

    const initializePiSDK = () => {
      if (typeof window !== 'undefined' && (window as any).Pi) {
        const pi = (window as any).Pi;
        const isPiBrowser =
          typeof navigator !== 'undefined' && /PiBrowser/i.test(navigator.userAgent);

        try {
          pi.init({ version: "2.0", sandbox: !isPiBrowser });
          (window as any).__PI_INITIALIZED__ = true;
          console.log(`[MESH-BRIDGE] ðŸŸ¢ Pi SDK Initialized cleanly. Sandbox Mode: ${!isPiBrowser}`);
          return true;
        } catch (err) {
          (window as any).__PI_INITIALIZED__ = true;
          console.warn("[MESH-BRIDGE] SDK already initialized elsewhere.", err);
          return true;
        }
      }
      return false;
    };

    if (initializePiSDK()) return;

    const syncInterval = setInterval(() => {
      checkCount++;
      if (initializePiSDK() || checkCount > 20) {
        clearInterval(syncInterval);
        if (checkCount > 20) {
          console.warn("[MESH-BRIDGE] âš ï¸ Pi SDK load timed out.");
        }
      }
    }, 250);

    return () => clearInterval(syncInterval);
  }, []);

  const onIncompletePaymentFound = async (payment: any) => {
    console.warn("[MESH-BRIDGE] âš ï¸ Orphaned payment detected:", payment?.identifier);
    if (payment?.identifier && payment?.transaction?.txid) {
      await fetch('/api/pi/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.identifier,
          txid: payment.transaction.txid,
              uid: payment?.user_uid,
        }),
      }).catch((err) => console.error("[MESH-BRIDGE] Payment recovery failed:", err));
    }
  };

  const handlePioneerLogin = async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      let activeUid = "";
      let activeUsername = "";
      let activeAccessToken: string | undefined;

      const pi = typeof window !== 'undefined' ? (window as any).Pi : null;
      const isLocalDev =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.startsWith('192.168.'));

      // 1. ENVIRONMENT CHECK: Pi Browser SDK vs Local X570 Dev
      if (pi && (window as any).__PI_INITIALIZED__) {
        console.log("[MESH-BRIDGE] ðŸ›°ï¸ Triggering Native Authenticate Prompt...");
        const scopes = ['username', 'payments', 'wallet_address'];
        const authResults = await pi.authenticate(scopes, onIncompletePaymentFound);

        activeUid = authResults?.user?.uid || "";
        activeUsername = authResults?.user?.username || "";
        activeAccessToken = authResults?.accessToken;
      } else if (isLocalDev) {
        console.warn("[MESH-BRIDGE] âš ï¸ Bypassing SDK for Local X570 Environment.");
        activeUid = "DEV_NODE_001";
        activeUsername = "Bazaar_Founder";
      } else {
        throw new Error("Pi SDK not detected. Please open Bazaar Republic inside Pi Browser.");
      }

      if (!activeUid) {
        throw new Error("No valid Pioneer UID returned from authentication.");
      }

      // 2. THE GATEWAY BRIDGE: Routing to Zero-Trust Backend
      const backendVerify = await fetch('/api/pioneer/handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: activeUid,
          username: activeUsername,
          accessToken: activeAccessToken,
        }),
      });

      const result = await backendVerify.json().catch(() => ({}));

      if (!backendVerify.ok || !result.success) {
        throw new Error(result.error || `Vault check failed. Status: ${backendVerify.status}.`);
      }

      // 3. LOCK THE SESSION
      setPioneer({
        uid: activeUid,
        username: activeUsername,
        accessToken: activeAccessToken,
      });

      console.log(`[MESH-BRIDGE] ðŸŸ¢ Pioneer @${activeUsername} fully authorized & locked.`);

      // 4. ROUTE TO DASHBOARD
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error("[MESH-BRIDGE] ðŸš¨ Handshake rejected.", error);
      setAuthError(error?.message || "Failed to sync secure session. Check network / whitelist settings.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="p-6 bg-zinc-950 text-emerald-400 border border-emerald-500/50 rounded-lg shadow-2xl max-w-md mx-auto font-mono">
      <h2 className="text-xl font-bold mb-4 border-b border-zinc-800 pb-2 uppercase tracking-widest">
        <span className="text-zinc-100">Bazaar Republic</span> | E-Network
      </h2>

      {pioneer ? (
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">Status: <span className="text-emerald-400 font-bold">Uplink Secured</span></p>
          <p className="text-sm">Pioneer: <span className="font-bold text-zinc-100">@{pioneer.username}</span></p>
          <p className="text-xs text-zinc-600 truncate mt-2">UID: {pioneer.uid}</p>
          <p className="text-xs text-emerald-500/70 mt-4 animate-pulse">Routing to Sector Dashboard...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {isAuthenticating ? (
            <div className="flex flex-col items-center space-y-4 my-4">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm animate-pulse tracking-widest">FORGING HANDSHAKE...</p>
            </div>
          ) : (
            <button
              onClick={handlePioneerLogin}
              className="w-full py-3 mt-2 bg-emerald-900/40 border border-emerald-600 hover:bg-emerald-800 text-emerald-100 font-bold tracking-widest rounded transition-all uppercase text-sm"
            >
              Initiate Node Uplink
            </button>
          )}

          {authError && (
            <div className="mt-4 p-3 w-full bg-red-950/40 border border-red-900 text-red-400 text-xs rounded text-center">
              âš ï¸ {authError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
