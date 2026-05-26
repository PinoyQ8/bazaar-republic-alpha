// Route: /app/components/auth/pioneer-auth.tsx
// Logic: E-Network Entry Gate & SDK Handshake (MESH Hardened)

"use client";

import React, { useState, useEffect } from 'react';

// Define the Pioneer payload structure expected from the Pi SDK
interface PioneerData {
  uid: string;
  username: string;
  accessToken: string;
}

export default function PioneerAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [pioneer, setPioneer] = useState<PioneerData | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // 🛡️ TIMING RETRY LOOP: Ensure Pi SDK initializes even with slower edge network streaming
  useEffect(() => {
    let checkCount = 0;
    
    const initializePiSDK = () => {
      if (typeof window !== 'undefined' && (window as any).Pi) {
        try {
          const pi = (window as any).Pi;
          // Sandbox flags true for vercel preview deployments, false for live mainnet address
          const isLiveMainnet = window.location.hostname.includes("project-bazaar-mainnet");
          
          pi.init({ version: "2.0", sandbox: !isLiveMainnet });
          console.log("[MESH-BRIDGE] 🟢 Pi SDK Initialized cleanly via Component Sector.");
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
      }
    }, 250);

    return () => clearInterval(syncInterval);
  }, []);

  const handlePioneerLogin = async () => {
    if (typeof window === 'undefined' || !(window as any).Pi) {
      setAuthError("Pi Network environment not fully attached yet. Retry in a moment.");
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const pi = (window as any).Pi;
      const scopes = ['username', 'payments'];
      
      console.log("[MESH-BRIDGE] 🛰️ Triggering Native Authenticate Prompt...");
      const authResults = await pi.authenticate(scopes, onIncompletePaymentFound);

      // --- 🛡️ FIXED SECURITY INJECTION: Redirected from ghost path to active transaction sector ---
      const backendVerify = await fetch('/api/mesh-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: "verify-token", // Explicit action payload handling
          accessToken: authResults.accessToken,
          uid: authResults.user.uid
        })
      });

      if (!backendVerify.ok) {
        throw new Error("Vault check failed. Rogue token discarded.");
      }
      // -----------------------------------------------------------------------------------------

      // Only write to RAM if your active transaction route approves the signature
      setPioneer({
        uid: authResults.user.uid,
        username: authResults.user.username,
        accessToken: authResults.accessToken
      });

      console.log(`[MESH-BRIDGE] 🟢 Pioneer @${authResults.user.username} fully authorized & locked.`);

    } catch (error) {
      console.error("[MESH-BRIDGE] 🚨 Handshake rejected.", error);
      setAuthError("Failed to sync secure session. Check network / whitelist settings.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Callback for orphaned payments (DEX prep)
  const onIncompletePaymentFound = (payment: any) => {
    console.log("[MESH-BRIDGE] ⚠️ Orphaned payment detected. Routing to DEX resolve...", payment);
    // Future Protocol 23 Logic goes here
  };

  return (
    <div className="p-6 bg-gray-900 text-green-400 border border-green-500 rounded-lg shadow-md max-w-md mx-auto font-mono">
      <h2 className="text-xl font-bold mb-4 border-b border-green-700 pb-2">
        <span className="text-white">Bazaar Republic</span> | E-Network Access
      </h2>

      {pioneer ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-300">Status: <span className="text-green-400">Authenticated</span></p>
          <p className="text-sm">Pioneer: <span className="font-bold text-white">@{pioneer.username}</span></p>
          <p className="text-xs text-gray-500 truncate mt-2">UID: {pioneer.uid}</p>
          <button 
            onClick={() => setPioneer(null)}
            className="mt-4 px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 text-sm rounded border border-red-700 transition-colors"
          >
            Flush Session
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {isAuthenticating ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm animate-pulse">Forging SDK Handshake...</p>
            </div>
          ) : (
            <button
              onClick={handlePioneerLogin}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-black font-bold rounded transition-colors"
            >
              Authenticate via Pi
            </button>
          )}
          
          {authError && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-500 text-red-400 text-xs rounded">
              ⚠️ {authError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}