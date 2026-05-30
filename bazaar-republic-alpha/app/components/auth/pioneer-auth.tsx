// Route: /app/components/auth/pioneer-auth.tsx
// Logic: E-Network Entry Gate & SDK Handshake (MESH Hardened)

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Define the Pioneer payload structure expected from the UI
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

  // 🛡️ TIMING RETRY LOOP: Ensure Pi SDK initializes even with slower edge networks
  useEffect(() => {
    let checkCount = 0;
    
    const initializePiSDK = () => {
      if (typeof window !== 'undefined' && (window as any).Pi) {
        try {
          const pi = (window as any).Pi;
          // Sandbox flags true for Vercel preview deployments, false for live mainnet address
          const isLiveMainnet = window.location.hostname.includes("bazaatmainnet-dao.vercel.app");
          
          pi.init({ version: "2.0", sandbox: !isLiveMainnet });
          
          // [MESH-FIX]: Physically set the flag in the window object so the guard can read it.
          (window as any).__PI_INITIALIZED__ = true; 
          
          console.log(`[MESH-BRIDGE] 🟢 Pi SDK Initialized cleanly. Sandbox Mode: ${!isLiveMainnet}`);
          return true;
        } catch (err) {
          console.warn("[MESH-BRIDGE] SDK initialization collision handled.", err);
          return true; // Already initialized elsewhere
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
           console.warn("[MESH-BRIDGE] ⚠️ Pi SDK load timed out. Running in local X570 Dev Mode.");
        }
      }
    }, 250);

    return () => clearInterval(syncInterval);
  }, []);

  // Callback for orphaned payments (Protocol 24 Prep)
  const onIncompletePaymentFound = (payment: any) => {
    console.log("[MESH-BRIDGE] ⚠️ Orphaned payment detected. Routing to DEX resolve...", payment);
  };

  // 🛡️ ENFORCE A RIGID HANDSHAKE GUARD AT THE RUNTIME LAYER
  const handlePioneerLogin = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
  
    try {
      let activeUid = "";
      let activeUsername = "";

      // 1. ENVIRONMENT CHECK: Pi Browser vs X570 Local Dev
      if (typeof window !== 'undefined' && (window as any).__PI_INITIALIZED__) {
        console.log("[MESH-BRIDGE] 🛰️ Triggering Native Authenticate Prompt...");
        const pi = (window as any).Pi;
        const scopes = ['username', 'payments'];
        const authResults = await pi.authenticate(scopes, onIncompletePaymentFound);
        
        activeUid = authResults.user.uid;
        activeUsername = authResults.user.username;
      } else {
        // X570 Local Override (Ensures you can still test the dashboard on Chrome)
        console.warn("[MESH-BRIDGE] ⚠️ Bypassing SDK for Local X570 Environment.");
        activeUid = "DEV_NODE_001";
        activeUsername = "Bazaar_Founder";
      }

      // 2. THE GATEWAY BRIDGE: Routing to our new Zero-Trust Backend
      const backendVerify = await fetch('/api/pioneer/handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: activeUid })
      });

      const result = await backendVerify.json();

      if (!backendVerify.ok || !result.success) {
        throw new Error(result.error || `Vault check failed. Status: ${backendVerify.status}.`);
      }

      // 3. LOCK THE SESSION
      setPioneer({
        uid: activeUid,
        username: activeUsername,
      });

      console.log(`[MESH-BRIDGE] 🟢 Pioneer @${activeUsername} fully authorized & locked.`);

      // 4. ROUTE TO DASHBOARD
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000); // 1-second delay so the user sees the Success UI before transition

    } catch (error: any) {
      console.error("[MESH-BRIDGE] 🚨 Handshake rejected.", error);
      setAuthError(error.message || "Failed to sync secure session. Check network / whitelist settings.");
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
              ⚠️ {authError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}