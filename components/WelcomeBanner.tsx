"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WelcomeBanner() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState<boolean>(false);

  useEffect(() => {
    // Check if the Pioneer has visited before
    const hasVisited = localStorage.getItem("mesh_welcomed");
    if (!hasVisited) {
      setShowWelcome(true);
    }
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem("mesh_welcomed", "true");
    setShowWelcome(false);
    router.push("/academy");
  };

  if (!showWelcome) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-mono">
      <div className="max-w-xl w-full max-h-[85vh] flex flex-col justify-between border border-green-800/80 bg-slate-950 p-5 sm:p-6 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.15)] space-y-4 my-auto overflow-y-auto">
        
        {/* Header Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-[11px] text-green-500 tracking-widest uppercase">[PROTOCOL 28 INITIALIZATION]</span>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
        </div>

        {/* Body Copy */}
        <div className="space-y-3">
          <h1 className="text-lg sm:text-xl font-bold text-white">Welcome, Pioneer.</h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            You have accessed the <span className="text-slate-200 font-semibold">Project Bazaar E-Network</span> workstation. 
            This decentralized environment relies on rigorous node synchronization, Soroban smart contract escrow flows, 
            and active TTL safeguards.
          </p>
        </div>

        {/* System Matrix Card */}
        <div className="bg-black/80 border border-slate-900 p-3 sm:p-4 rounded-lg text-xs text-slate-400 space-y-1.5">
          <p>🔒 Node Security: <span className="text-emerald-400 font-bold">Active</span></p>
          <p>🌐 Network Layer: <span className="text-emerald-400 font-bold">Stellar Testnet (Soroban)</span></p>
          <p>⚡ Action Required: <span className="text-yellow-500 font-medium">Complete MESH Academy Orientation</span></p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleAcknowledge}
            className="w-full py-3 bg-green-900/40 border border-green-700 text-green-400 hover:bg-green-900/60 active:scale-[0.98] text-xs sm:text-sm rounded-lg transition-all font-bold tracking-wide shadow-lg flex items-center justify-center gap-2"
          >
            Initialize Node & Enter Academy &rarr;
          </button>
        </div>

      </div>
    </div>
  );
}