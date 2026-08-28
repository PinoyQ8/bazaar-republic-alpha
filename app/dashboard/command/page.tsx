// Location: app/dashboard/command/page.tsx
"use client";

import { useState } from "react";
import { seedVirtualMarket } from "@/app/actions/marketActions";
import { Terminal } from "lucide-react";

export default function CommandCenterViewport() {
  // 🛡️ DEV-TOOL: Virtual Market Seeder
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const handleSeedMarket = async () => {
    setIsSeeding(true);
    setSeedResult("Injecting test services into E-Network...");
    
    try {
      const res = await seedVirtualMarket();
      setSeedResult(res.success ? `✅ ${res.message}` : `🚨 ${res.message}`);
    } catch (error) {
      setSeedResult("🚨 FATAL: Seeder execution failed.");
    } finally {
      setIsSeeding(false);
      
      // Auto-clear message after 5 seconds
      setTimeout(() => setSeedResult(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-300 font-mono p-4 md:p-8 space-y-6 pb-24">
      
      {/* 🛰️ HEADER MATRIX */}
      <header className="border-b border-purple-900/60 pb-4 space-y-2">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-purple-500" />
          <h1 className="text-xl font-bold tracking-tight text-purple-500 uppercase">
            Command Center
          </h1>
        </div>
        <p className="text-xs text-neutral-500 uppercase tracking-widest">
          Root Level System Operations & Dev Tools
        </p>
      </header>

      {/* ⚡ DEV-TOOL: VIRTUAL MARKET SEEDER */}
      <div className="max-w-md p-4 bg-purple-950/20 border border-purple-900/50 rounded-lg space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest">
              Testnet Injection
            </h3>
            <p className="text-[10px] text-neutral-500 mt-1">
              Populates the Service Marketplace with dummy listings for TS calculation testing.
            </p>
          </div>
        </div>
        
        <button
          onClick={handleSeedMarket}
          disabled={isSeeding}
          className="w-full py-2 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700 text-purple-300 font-bold text-xs uppercase tracking-widest rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSeeding ? "SEEDING MATRIX..." : "⚡ SEED VIRTUAL MARKET"}
        </button>
        
        {/* Status Feedback */}
        {seedResult && (
          <div className="mt-2 text-[10px] font-mono p-2 bg-black border border-purple-900/50 text-purple-400 rounded">
            {seedResult}
          </div>
        )}
      </div>

    </div>
  );
}