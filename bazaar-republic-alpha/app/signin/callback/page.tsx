// Location: app/signin/callback/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, ShieldAlert, Fingerprint, RefreshCw } from "lucide-react";

export default function SignInCallback() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [status, setStatus] = useState("INTERCEPTING OAUTH PAYLOAD...");
  const [error, setError] = useState<string | null>(null);
  
  // 🛡️ Prevent React Strict Mode Double-Execution
  const isProcessing = useRef(false);

  useEffect(() => {
    if (isProcessing.current) return;
    
    const processOAuthFragment = async () => {
      isProcessing.current = true;
      try {
        // 1. 🔍 FRAGMENT EXTRACTION
        const hash = window.location.hash.slice(1);
        if (!hash) {
          throw new Error("NO_OAUTH_FRAGMENT_DETECTED");
        }
        
        const params = new URLSearchParams(hash);

        // 2. 🛡️ CSRF VERIFICATION (The State Shield)
        const returnedState = params.get("state");
        const expectedState = sessionStorage.getItem("pi_oauth_state");
        sessionStorage.removeItem("pi_oauth_state"); // Burn after reading

        if (!expectedState || returnedState !== expectedState) {
          throw new Error("CSRF_STATE_MISMATCH_ALERT");
        }

        // 3. 🛑 ERROR TRAP (User denied or server fault)
        const authError = params.get("error");
        if (authError) {
          throw new Error(`OAUTH_REJECTION: ${authError.toUpperCase()}`);
        }

        // 4. 🔑 TOKEN HARVESTING
        const accessToken = params.get("access_token");
        if (!accessToken) {
          throw new Error("MISSING_ACCESS_TOKEN");
        }

        setStatus("AUTHENTICATING MESH IDENTITY...");

        // 5. 🌐 IDENTITY FORGE (Ping live Pi Network API)
        const meRes = await fetch("https://api.minepi.com/v2/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!meRes.ok) {
          throw new Error(`PI_API_FAULT: ${meRes.status}`);
        }

        const userData = await meRes.json();
        
        setStatus("IDENTITY VERIFIED. SYNCING MASTER LEDGER...");

        // 6. 💾 SEED THE MASTER TS
        login({
          uid: userData.uid,
          username: userData.username,
          status: "ACTIVE",
          // The backend will fetch TrustScore & Tier in the background later
        });

        // 7. 🧹 CLEANUP & REDIRECT (Wipe the token from URL history)
        window.history.replaceState(null, "", window.location.pathname);
        
        setTimeout(() => {
          // Push to dashboard with the salted sync flag
          router.push("/dashboard?v=FORCE_SYNC");
        }, 1000);

      } catch (err: any) {
        console.error("[OAUTH-FRACTURE]", err);
        setError(err.message || "UNKNOWN_AUTH_FRACTURE");
        window.history.replaceState(null, "", window.location.pathname);
      }
    };

    processOAuthFragment();
  }, [login, router]);

  // 🔴 RENDER: FAULT STATE
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-mono">
        <div className="max-w-md w-full bg-red-950/20 border border-red-900/50 rounded-xl p-6 shadow-[0_0_30px_rgba(185,28,28,0.15)] text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
          <h2 className="text-red-500 text-lg font-bold tracking-widest uppercase">Mesh Gateway Fractured</h2>
          <div className="bg-slate-900 p-3 rounded border border-slate-800 text-slate-400 text-xs text-left">
            Error Code: <span className="text-red-400 font-bold">{error}</span>
          </div>
          <button 
            onClick={() => router.push("/")}
            className="mt-4 px-6 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs tracking-wider transition-colors"
          >
            RETURN TO GENESIS GATE
          </button>
        </div>
      </div>
    );
  }

  // 🟢 RENDER: PROCESSING STATE
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4 font-mono space-y-6">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full animate-ping"></div>
        <div className="relative z-10 w-16 h-16 bg-slate-900 border-2 border-cyan-500 flex items-center justify-center rounded-full shadow-[0_0_30px_rgba(6,182,212,0.4)]">
          <Fingerprint className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="text-cyan-400 font-bold tracking-widest flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          OAUTH HANDSHAKE IN PROGRESS
        </h2>
        <p className="text-slate-500 text-xs uppercase tracking-wider max-w-xs mx-auto">
          {status}
        </p>
      </div>
    </div>
  );
}