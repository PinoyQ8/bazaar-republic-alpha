"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { safePiAuthenticate } from "@/app/utils/safePi";

export default function OnboardingPage() {
  const router = useRouter();
  const [telemetry, setTelemetry] = useState<string>("Initializing MESH Node...");
  const [isSdkReady, setIsSdkReady] = useState<boolean>(false);

  useEffect(() => {
    // 🛡️ MESH Localhost Auto-Ready Bypass
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    
    if (isLocalhost) {
      setIsSdkReady(true);
      setTelemetry("Localhost Node Detected. Pi SDK Mock Active.");
      return;
    }

    // Production check for real Pi SDK script
    const checkPi = setInterval(() => {
      if ((window as any).Pi) {
        setIsSdkReady(true);
        setTelemetry("Pi SDK Online. Awaiting Real Pioneer Authentication.");
        clearInterval(checkPi);
      }
    }, 500);

    return () => clearInterval(checkPi);
  }, []);

  async function handlePiAuth() {
    setTelemetry("Forging Block... Authenticating via Pi Network");
    try {
      const auth = await safePiAuthenticate(["username", "payments"]);
      
      setTelemetry("[STATUS 200] Identity Forged. Synchronizing Ledger...");
      
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auth),
      });

      if (!res.ok) throw new Error("Internal MESH Sync Rejected.");

      setTelemetry("[STATUS 200] Identity Forged. Redirecting...");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err: any) {
      setTelemetry(`[ERROR] ${err.message}`);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6 font-mono text-zinc-100 min-h-screen flex flex-col justify-center">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg space-y-4">
        <h2 className="text-lg font-bold text-indigo-400">NEO PROTOCOL</h2>
        <p className="text-xs text-zinc-400">Stage 1: Identity Handshake</p>
        
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded text-xs text-emerald-400">
          Terminal Telemetry:<br/>
          <span className="text-zinc-300">{telemetry}</span>
        </div>

        <button
          onClick={handlePiAuth}
          disabled={!isSdkReady}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded transition-colors text-sm"
        >
          Authenticate via Pi Network
        </button>
      </div>
    </div>
  );
}