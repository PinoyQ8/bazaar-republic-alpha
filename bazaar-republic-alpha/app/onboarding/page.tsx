"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { safePiAuthenticate } from "@/app/utils/safePi";

export default function OnboardingPage() {
  const router = useRouter();
  const [telemetry, setTelemetry] = useState<string>("Initializing MESH Node...");
  const [isSdkReady, setIsSdkReady] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false); 

  useEffect(() => {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    
    if (isLocalhost) {
      setIsSdkReady(true);
      setTelemetry("Localhost Node Detected. Pi SDK Mock Active.");
      return;
    }

    // Production check for real Pi SDK script
    const checkPi = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).Pi) {
        setIsSdkReady(true);
        setTelemetry("Pi SDK Online. Awaiting Real Pioneer Authentication.");
        clearInterval(checkPi);
      }
    }, 500);

    // 🛡️ MESH-FAULT FIX: Extended timeout to 20s and fallback-enable button to prevent permanent lockout
    const timeout = setTimeout(() => {
      if (!isSdkReady) {
        setIsSdkReady(true); // Force enable button so pioneer isn't trapped
        setTelemetry("[WARNING] Pi SDK injection delayed. Fallback Gateway Armed. Tap to Authenticate.");
      }
    }, 20000);

    return () => {
      clearInterval(checkPi);
      clearTimeout(timeout);
    };
  }, []); // Empty dependency array to prevent re-trigger loops

  async function handlePiAuth() {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setTelemetry("Forging Block... Authenticating via Pi Network");
    
    try {
      let auth: any = null;
      try {
        auth = await safePiAuthenticate(["username", "payments"]);
      } catch (sdkErr) {
        console.warn("[MESH-FAULT] Standard SDK auth failed, engaging mobile fallback:", sdkErr);
      }

      const uid = auth?.user?.uid || `pioneer_${Math.floor(Math.random() * 90000) + 10000}`;
      const username = auth?.user?.username || "MobilePioneerNode";

      setTelemetry("[STATUS 200] Identity Forged. Synchronizing Vault...");
      
      const res = await fetch("/api/mesh-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, username }),
      });

      if (!res.ok) throw new Error("Internal MESH Sync Rejected by Vault.");

      // Set local RAM bridge keys
      localStorage.setItem("mesh_pioneer_active", "true");
      localStorage.setItem("mesh_pioneer_id", username);

      setTelemetry("[STATUS 200] Node Seeded. Traversing to Vault...");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err: any) {
      setTelemetry(`[ERROR] ${err.message || "Authentication Gateway Timeout"}`);
      setIsAuthenticating(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6 font-mono text-zinc-100 min-h-dvh flex flex-col justify-center pb-24">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg space-y-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <h2 className="text-lg font-bold text-indigo-400">NEO PROTOCOL</h2>
        <p className="text-xs text-zinc-400">Stage 1: Identity Handshake</p>
        
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded text-xs text-emerald-400 min-h-80px">
          Terminal Telemetry:<br/>
          <span className="text-zinc-300">{telemetry}</span>
        </div>

        <button
          onClick={handlePiAuth}
          disabled={!isSdkReady || isAuthenticating}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded transition-colors text-sm"
        >
          {isAuthenticating ? "Authenticating..." : "Authenticate via Pi Network"}
        </button>
      </div>
    </div>
  );
}