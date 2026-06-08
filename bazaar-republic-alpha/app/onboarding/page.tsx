"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

// 🛡️ BAZAAR TECH: Strict typing for Pi SDK interop
interface PiUser { uid: string; username: string; }
interface PiAuthResponse { user: PiUser; }

export default function PioneerOnboarding() {
  const router = useRouter();
  const [isForging, setIsForging] = useState(false);
  const [telemetry, setTelemetry] = useState("Awaiting Pi SDK Initialization...");
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    if (sdkLoaded && typeof window !== "undefined") {
      const Pi = (window as any).Pi;
      if (Pi) {
        Pi.init({ version: "2.0", sandbox: true }); 
        setTelemetry("Pi SDK Online. Awaiting Real Pioneer Authentication.");
      }
    }
  }, [sdkLoaded]);

  const handlePiAuth = async () => {
    setIsForging(true);
    setTelemetry("Initiating Mainnet Handshake...");

    try {
      const Pi = (window as any).Pi;
      
      // 1. Trigger Pi Network Auth Gate
      const scopes = ['username']; // Removed 'payments' as it is not needed for onboarding
      
      setTelemetry("Awaiting Pioneer Signature...");
      const auth = await Pi.authenticate(scopes) as PiAuthResponse;
      
      if (!auth?.user?.uid) throw new Error("Handshake Failed: Identity Null.");

      setTelemetry(`[STATUS 200] Pioneer Verified: ${auth.user.username}`);

      // 2. Forge the internal MESH Identity
      setTelemetry("Syncing Identity to Local Replica Set...");
      
      // 🛡️ BAZAAR TECH: Hard-code the registration endpoint
const res = await fetch('/api/auth/register', { // MUST BE THIS PATH
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: auth.user.uid,
    username: auth.user.username,
  })
});

      if (!res.ok) throw new Error("Internal MESH Sync Rejected.");

      setTelemetry("[STATUS 200] Identity Forged. Redirecting...");
      setTimeout(() => router.push("/dashboard"), 1000);
      
    } catch (error) {
      console.error("[MESH-ERROR]", error);
      setTelemetry("[STATUS 403] Authentication Fracture. Retry Initialization.");
    } finally {
      setIsForging(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center p-6">
      <Script 
        src="https://sdk.minepi.com/pi-sdk.js" 
        onLoad={() => setSdkLoaded(true)}
      />

      <div className="w-full max-w-md border border-green-800 bg-gray-900 p-8 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
        <h1 className="text-2xl font-bold mb-2 tracking-widest border-b border-green-800 pb-2">
          NEO PROTOCOL
        </h1>
        <p className="text-xs text-green-700 mb-6 uppercase tracking-widest">
          Stage 1: Identity Handshake
        </p>

        <div className="space-y-6">
          <button
            onClick={handlePiAuth}
            disabled={!sdkLoaded || isForging}
            className="w-full border border-green-500 bg-black hover:bg-green-900 hover:text-white text-green-500 font-bold py-4 uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isForging ? "Forging Block..." : "Authenticate via Pi Network"}
          </button>
        </div>

        <div className="mt-8 pt-4 border-t border-green-800">
          <p className="text-xs text-gray-500">Terminal Telemetry:</p>
          <p className="text-sm mt-1 animate-pulse">{telemetry}</p>
        </div>
      </div>
    </div>
  );
}