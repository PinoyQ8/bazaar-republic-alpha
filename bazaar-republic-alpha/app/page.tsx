'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Zap, ArrowRight, Wallet } from 'lucide-react';

export default function MasterDashboard() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(1);

  useEffect(() => {
    // Verify local storage initialization flag
    const pioneerStatus = localStorage.getItem('mesh_pioneer_active');
    if (pioneerStatus === 'true') {
      setIsFirstTime(false);
    }
    setIsInitializing(false);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('mesh_pioneer_active', 'true');
    localStorage.setItem('mesh_pioneer_ts', Date.now().toString());
    setIsFirstTime(false);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-400 flex items-center justify-center font-mono text-xs">
        INITIALIZING MESH PROTOCOL...
      </div>
    );
  }

  // TRACK 1: FIRST-TIME PIONEER UI (Genesis Gate)
  if (isFirstTime) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-mono flex flex-col justify-between max-w-[384px] mx-auto pb-24">
        <header className="pt-4 border-b border-cyan-500/20 pb-3">
          <div className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase">
            PROJECT BAZAAR // GENESIS GATE
          </div>
          <h1 className="text-xl font-extrabold text-slate-100 mt-1">Pioneer Activation</h1>
        </header>

        {/* Step 1: Protocol Welcome */}
        {onboardingStep === 1 && (
          <div className="space-y-4 my-auto">
            <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" /> MESH PROTOCOL ONLINE
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Welcome to the Republic DAO. To participate in node consensus, trade in the E-Network, and access the Vault, initialize your Pioneer identity.
              </p>
            </div>
            <button
              onClick={() => setOnboardingStep(2)}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              INITIALIZE HANDSHAKE <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Pi Wallet Sync */}
        {onboardingStep === 2 && (
          <div className="space-y-4 my-auto">
            <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Wallet className="w-5 h-5" /> PI NETWORK HANDSHAKE
              </div>
              <p className="text-xs text-slate-300">
                Connect your Pi Wallet address to synchronize your balance with the Vault Sector.
              </p>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono">
                SDK STATUS: <span className="text-emerald-400">READY</span>
              </div>
            </div>
            <button
              onClick={completeOnboarding}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              AUTHENTICATE & ENTER REPUBLC
            </button>
          </div>
        )}

        <footer className="text-center text-[10px] text-slate-500 font-mono tracking-widest">
  PROJECT BAZAAR // NEO PROTOCOL v2.3
</footer>
      </div>
    );
  }

  // TRACK 2: RETURNING PIONEER UI (Master Dashboard)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-mono max-w-[384px] mx-auto pb-24 space-y-4">
      {/* Quick Re-Sync Banner */}
      <header className="border-b border-cyan-500/20 pb-3 flex justify-between items-center">
        <div>
          <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">
            ● NEO-SYNC ACTIVE
          </div>
          <h1 className="text-lg font-bold text-slate-100">Bazaar Master Node</h1>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400">SHIELD</span>
          <div className="text-xs font-bold text-cyan-400">92% UPTIME</div>
        </div>
      </header>

      {/* Primary Telemetry Card */}
      <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded-xl space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">PIONEER STATUS</span>
          <span className="text-cyan-400 font-bold">VERIFIED CO-PIONEER</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">VAULT SYNC</span>
          <span className="text-slate-200 font-bold">3,140.90 π</span>
        </div>
      </div>

      {/* Quick Sector Shortcuts */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-1">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200">MESH Telemetry</span>
          <span className="text-[10px] text-slate-400">Nodes Active</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">E-Network</span>
          <span className="text-[10px] text-slate-400">Bridge Ready</span>
        </div>
      </div>
    </div>
  );
}