"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { lockAcademyModule } from "@/app/actions/academy";

// 🛡️ STATIC TELEMETRY ARRAY DEFINITION
const TELEMETRY_LINES: string[] = [
  "Bazaar_Tech@X570:~$ init_mesh_scan --target=pioneer_auth",
  "[...] Awaiting Pi Network CDN Response",
  "[OK] AccessToken intercepted. Commencing Verification.",
  "[OK] api.testnet.minepi.com/v2/me returned 200 OK.",
  "[INFO] Forging HttpOnly Session Cookie...",
  "[SECURE] Perimeter Locked. Route /academy is active."
];

export default function ZeroTrustTerminal({ pioneerUid }: { pioneerUid: string }) {
  const router = useRouter();
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [isAcknowledged, setIsAcknowledged] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // The Animation Forge
  useEffect(() => {
    if (visibleLines < TELEMETRY_LINES.length) {
      const timer = setTimeout(() => {
        setVisibleLines((prev) => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  // The Database Handshake (HARDENED MESH)
  const handleAcknowledge = async () => {
    setIsProcessing(true);
    
    // SHIELD 1: Pre-Flight Verification
    if (pioneerUid === "UNVERIFIED_NODE") {
      setIsProcessing(false);
      alert("AUTH LOCK: Cannot sync to Neon. Node is unverified. Please load this route inside the Pi Browser or Sandbox.");
      return; // Halt the function before wasting Neon compute
    }

    try {
      // Fire the Server Action to the Neon Cluster
      const response = await lockAcademyModule(pioneerUid, "module-03-zero-trust");
      
      // SHIELD 2: Expose the Raw Payload
      if (response.success) {
        setIsAcknowledged(true);
      } else {
        setIsProcessing(false);
        // Expose the exact Neon error if the server action provides it
        console.error("[NEON_REJECT]:", response.error || "Unknown Database Failure");
        alert(`MESH Connection Failed: ${response.error || "Check Node Status."}`);
      }
    } catch (error) {
      // Catch network-level Vercel timeouts (504s)
      setIsProcessing(false);
      console.error("[VERCEL_TIMEOUT]:", error);
      alert("MESH Connection Failed: Serverless function timed out.");
    }
  };

  return (
    <div className="w-full max-w-2xl bg-black border border-green-900/50 rounded-sm p-6 shadow-2xl font-mono">
      {/* Philosophy Header */}
      <div className="mb-6 border-b border-green-900/60 pb-4">
        <h2 className="text-xl text-white mb-2 tracking-widest uppercase">Zero-Trust Protocol</h2>
        <p className="text-green-400/80 text-sm italic">
          "A DAO without a hardened perimeter is just a public chatroom. The MESH is the immune system of the Bazaar Republic."
        </p>
      </div>

      {/* Terminal Viewport */}
      <div className="bg-green-950/10 border border-green-900/40 p-4 rounded-sm text-sm text-green-400 min-h-40">
        <div className="text-green-600 mb-2 uppercase tracking-widest text-[10px]">// Live Node Telemetry Simulation</div>
        
        {TELEMETRY_LINES.slice(0, visibleLines).map((line: string, index: number) => (
          <div key={index} className="mb-1 text-[11px]">&gt; {line}</div>
        ))}
        
        {visibleLines < TELEMETRY_LINES.length && (
          <div className="animate-pulse text-green-500">_</div>
        )}
      </div>

      {/* 🚀 ACTION BRIDGE */}
      <div className="mt-8 flex justify-between items-center">
        <button 
          onClick={() => router.back()}
          className="text-green-700 hover:text-green-400 transition-colors uppercase text-[10px] tracking-widest font-bold"
        >
          ← Back
        </button>
        
        {isAcknowledged ? (
          <button
            onClick={() => router.push('/academy/module-04')}
            className="px-6 py-2 font-bold tracking-widest uppercase transition-all duration-300 bg-emerald-600 text-black border border-emerald-500 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-[10px] rounded-sm"
          >
            Proceed to Capstone →
          </button>
        ) : (
          <button
            onClick={handleAcknowledge}
            disabled={visibleLines < TELEMETRY_LINES.length || isProcessing}
            className={`px-6 py-2 font-bold tracking-widest uppercase transition-all duration-300 text-[10px] rounded-sm ${
              visibleLines === TELEMETRY_LINES.length
                ? "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            }`}
          >
            {isProcessing ? "SYNCING TO NEON..." : "ACKNOWLEDGE PROTOCOL"}
          </button>
        )}
      </div>
    </div>
  );
}