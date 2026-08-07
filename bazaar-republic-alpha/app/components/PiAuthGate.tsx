// Location: app/components/PiAuthGate.tsx
"use client";

import React, { useState } from "react";
import { KeyRound, AlertTriangle } from "lucide-react";

interface PiAuthGateProps {
  clientId: string; // Your OAuth Client ID from Developer Portal
}

export default function PiAuthGate({ clientId }: PiAuthGateProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handlePiSignIn = () => {
    setIsRedirecting(true);
    
    // 1. Generate CSRF state token
    const state = crypto.randomUUID();
    sessionStorage.setItem("pi_oauth_state", state);

    // 2. Define local loopback or production redirect URI
    const redirectUri = window.location.origin + "/signin/callback";

    // 3. Construct OAuth Implicit Flow URL
    const authUrl = new URL("https://accounts.pinet.com/oauth/authorize");
    authUrl.searchParams.set("response_type", "token");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", "username"); // Requesting username only to match standard SDK
    authUrl.searchParams.set("state", state);

    // 4. Dispatch browser redirect to Pi Accounts server
    window.location.assign(authUrl.toString());
  };

  // 🛡️ CORRECTED: Disable ONLY if redirecting, missing, or still using the generic placeholder text
  const isInvalid = !clientId || clientId === "YOUR_CLIENT_ID_HERE";

  return (
    <div className="w-full space-y-3">
      <button
        onClick={handlePiSignIn}
        disabled={isRedirecting || isInvalid}
        className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded border border-purple-500/50 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
      >
        <KeyRound className="w-4 h-4" />
        {isRedirecting ? "CONNECTING..." : "Sign In with Pi (Web)"}
      </button>

      {isInvalid && (
        <div className="flex items-center gap-2 text-[10px] text-amber-500 bg-amber-950/30 p-2 rounded border border-amber-900/50">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <p>Dev Alert: Replace placeholder with your actual Portal Client ID.</p>
        </div>
      )}
    </div>
  );
}