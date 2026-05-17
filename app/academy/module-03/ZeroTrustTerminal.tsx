"use client";

import { useState, useEffect } from "react";
import { lockAcademyModule } from "@/app/actions/academy";

// 🛡️ STATIC TELEMETRY ARRAY DEFINITION (Fixes Code 2304)
const TELEMETRY_LINES: string[] = [
  "Bazaar_Tech@X570:~$ init_mesh_scan --target=pioneer_auth",
  "[...] Awaiting Pi Network CDN Response",
  "[OK] AccessToken intercepted. Commencing Verification.",
  "[OK] api.testnet.minepi.com/v2/me returned 200 OK.",
  "[INFO] Forging HttpOnly Session Cookie...",
  "[SECURE] Perimeter Locked. Route /academy is active."
];

export default function ZeroTrustTerminal({ pioneerUid }: { pioneerUid: string }) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [isAcknowledged, setIsAcknowledged] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // The Animation Forge: Prints the terminal lines sequentially
  useEffect(() => {
    if (visibleLines < TELEMETRY_LINES.length) {
      const timer = setTimeout(() => {
        setVisibleLines((prev) => prev + 1);
      }, 800); // 800ms delay per line for dramatic hard-coded effect
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  // The Database Handshake
  const handleAcknowledge = async () => {
    setIsProcessing(true);
    
    // Fire the Server Action to the Neon Cluster
    const response = await lockAcademyModule(pioneerUid, "module-03-zero-trust");
    
    if (response.success) {
      setIsAcknowledged(true);
    } else {
      setIsProcessing(false);
      alert("MESH Connection Failed. Check Node Status.");
    }
  };

  return (
    <div className="w-full max-w-2xl bg-black border border-gray-800 rounded p-6 shadow-2xl font-mono">
      {/* Philosophy Header */}
      <div className="mb-6 border-b border-gray-800 pb-4">
        <h2 className="text-xl text-white mb-2 tracking-widest uppercase">01 Zero-Trust Architecture</h2>
        <p className="text-gray-400 text-sm">
          "A DAO without a hardened perimeter is just a public chatroom. The MESH is the immune system of the Bazaar Republic."
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl text-white mb-2 tracking-widest uppercase">02 The Vault State Lock</h2>
        <p className="text-gray-400 text-sm">
          Session tokens are strictly isolated in HttpOnly cookies. The client DOM remains completely blind to vault keys.
        </p>
      </div>

      {/* Terminal Viewport */}
      <div className="bg-gray-900 p-4 rounded text-sm text-green-400 min-h-40">
        <div className="text-gray-500 mb-2">// Live Node Telemetry Simulation</div>
        
        {/* Explicitly typed arguments to neutralize error 7006 */}
        {TELEMETRY_LINES.slice(0, visibleLines).map((line: string, index: number) => (
          <div key={index} className="mb-1">{line}</div>
        ))}
        
        {visibleLines < TELEMETRY_LINES.length && (
          <div className="animate-pulse">_</div>
        )}
      </div>

      {/* Action Bridge */}
      <div className="mt-8 flex justify-between items-center">
        <button className="text-gray-500 hover:text-white transition-colors">
          ← Back
        </button>
        
        <button
          onClick={handleAcknowledge}
          disabled={visibleLines < TELEMETRY_LINES.length || isAcknowledged || isProcessing}
          className={`px-6 py-2 font-bold tracking-widest uppercase transition-all duration-300 ${
            isAcknowledged 
              ? "bg-green-600 text-black border-green-600 cursor-not-allowed"
              : visibleLines === TELEMETRY_LINES.length
                ? "bg-white text-black hover:bg-gray-200"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isProcessing ? "SYNCING..." : isAcknowledged ? "[SECURE] ACKNOWLEDGED" : "ACKNOWLEDGE"}
        </button>
      </div>
    </div>
  );
}