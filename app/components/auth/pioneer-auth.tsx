// Route: /app/components/auth/pioneer-auth.tsx
// Logic: E-Network Entry Gate & SDK Handshake

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

  // Initialize Pi SDK on mount
  useEffect(() => {
    // Ensuring the window object has the Pi SDK loaded via standard <script>
    if (typeof window !== 'undefined' && window.Pi) {
      window.Pi.init({ version: "2.0", sandbox: process.env.NODE_ENV !== 'production' });
      console.log("MESH Log: Pi SDK Initialized.");
    }
  }, []);

  const handlePioneerLogin = async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const scopes = ['username', 'payments'];
      const authResults = await window.Pi.authenticate(scopes, onIncompletePaymentFound);

      // --- NEW SECURITY INJECTION: The Backend Verify ---
      const backendVerify = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: authResults.accessToken })
      });

      if (!backendVerify.ok) {
        throw new Error("Vault check failed. Rogue token discarded.");
      }
      // ------------------------------------------------

      // Only write to RAM if the Vault approves
      setPioneer({
        uid: authResults.user.uid,
        username: authResults.user.username,
        accessToken: authResults.accessToken
      });

      console.log(`MESH Log: Pioneer ${authResults.user.username} fully authenticated & locked.`);

    } catch (error) {
      console.error("MESH Error: Handshake rejected.", error);
      setAuthError("Failed to sync secure session. Check network.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Callback for orphaned payments (DEX prep)
  const onIncompletePaymentFound = (payment: any) => {
    console.log("MESH Alert: Orphaned payment detected. Routing to DEX resolve...", payment);
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
              {/* Terminal-style Loading Skeleton */}
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