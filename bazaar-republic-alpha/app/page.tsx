// Location: /app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Zap, ArrowRight, Wallet, Activity, Database, Loader2, LogOut } from 'lucide-react';
import MasterMeshSwitch from "@/app/components/MasterMeshSwitch";
import { useMeshCurrency } from "@/app/hooks/useMeshCurrency"; // 🛡️ INJECTED CURRENCY HOOK

// 1. MESH IDENTITY OVERRIDE: Tell TypeScript about the Pi SDK
declare global {
  interface Window {
    Pi: any;
  }
}

export default function MasterDashboard() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [pioneerId, setPioneerId] = useState<string | null>(null);
  
  // 🛡️ INITIALIZE DYNAMIC CURRENCY
  const { text: piText, symbol: piSymbol } = useMeshCurrency();
  
  const [meshData, setMeshData] = useState({
    status: "SYNCING...",
    protocol: "p--.-",
    ledger: "-------"
  });

  useEffect(() => {
    const activeStatus = localStorage.getItem("mesh_pioneer_active");
    const storedId = localStorage.getItem("mesh_pioneer_id");
    
    if (activeStatus === "true" && storedId) {
      setPioneerId(storedId);
      setIsFirstTime(false);
    }
    
    const syncMesh = async () => {
      try {
        const res = await fetch("/api/mesh-scan");
        const data = await res.json();
        if (data.status === "MESH_ACTIVE") {
          setMeshData({
            status: "SYNCED",
            protocol: `p${data.telemetry.protocol_version}`,
            ledger: data.telemetry.latest_ledger.toLocaleString()
          });
        } else {
          setMeshData(prev => ({ ...prev, status: "FAULT" }));
        }
      } catch (err) {
        setMeshData(prev => ({ ...prev, status: "OFFLINE" }));
      } finally {
        setIsInitializing(false);
      }
    };

    syncMesh();
  }, []);

  // 2. THE CRYPTOGRAPHIC HANDSHAKE
  const completeOnboarding = async () => {
    setIsAuthenticating(true);

    try {
      const isOutsideSandbox = window.self === window.top;
      
      if (process.env.NODE_ENV === "development" && isOutsideSandbox) {
        console.warn("[MESH-FAULT] Operating outside Pi Sandbox. Using Dev Node bypass.");
        setTimeout(() => finalizeLogin("BazaarDevNode"), 1000);
        return;
      }

      if (typeof window === "undefined" || !window.Pi) {
        throw new Error("Pi SDK Missing. Ensure the SDK script is loaded in layout.tsx.");
      }

      console.log("[MESH-SYNC] Initializing Pi SDK Sandbox...");
      window.Pi.init({ 
        version: "2.0", 
        sandbox: process.env.NODE_ENV !== "production" 
      });

      const onIncompletePaymentFound = (payment: any) => {
        console.log("[MESH-SYNC] Incomplete payment detected:", payment);
      };

      const authResult = await window.Pi.authenticate(
        ["username", "payments"],
        onIncompletePaymentFound
      );

      console.log("[MESH-SYNC] Handshake accepted by:", authResult.user.username);
      finalizeLogin(authResult.user.username);

    } catch (error) {
      console.error("[MESH-FAULT] Authentication rejected or failed:", error);
      setIsAuthenticating(false);
    }
  };

  const finalizeLogin = (username: string) => {
    localStorage.setItem("mesh_pioneer_active", "true");
    localStorage.setItem("mesh_pioneer_id", username);
    localStorage.setItem("mesh_pioneer_ts", Date.now().toString());
    setPioneerId(username);
    setIsFirstTime(false);
    setIsAuthenticating(false);
  };

  const disconnectNode = () => {
    console.log("[MESH-SYNC] Initiating Node Disconnect (Flush RAM)...");
    localStorage.removeItem("mesh_pioneer_active");
    localStorage.removeItem("mesh_pioneer_id");
    localStorage.removeItem("mesh_pioneer_ts");
    
    setPioneerId(null);
    setOnboardingStep(1); 
    setIsFirstTime(true); 
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-400 flex flex-col items-center justify-center font-mono text-xs w-full max-w-[384px] mx-auto">
        <Activity className="w-8 h-8 mb-4 animate-pulse text-emerald-500" />
        <span className="tracking-widest">INITIALIZING MESH PROTOCOL...</span>
      </div>
    );
  }

  if (isFirstTime) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-mono flex flex-col justify-between w-full max-w-[384px] mx-auto pb-24">
        <header className="pt-4 border-b border-cyan-500/20 pb-3">
          <div className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase">
            PROJECT BAZAAR // GENESIS GATE
          </div>
          <h1 className="text-xl font-extrabold text-slate-100 mt-1">Pioneer Activation</h1>
        </header>

        {onboardingStep === 1 && (
          <div className="space-y-4 my-auto">
            <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded-xl space-y-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" /> MESH PROTOCOL ONLINE
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Welcome to the Republic DAO. Initialize your Pioneer identity to participate in node consensus.
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

        {onboardingStep === 2 && (
          <div className="space-y-4 my-auto">
            <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded-xl space-y-3 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Wallet className="w-5 h-5" /> PI NETWORK HANDSHAKE
              </div>
              <p className="text-xs text-slate-300">
                Connect your {piText} Wallet address to synchronize your balance with the Vault Sector.
              </p>
            </div>
            <button
              onClick={completeOnboarding}
              disabled={isAuthenticating}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> ESTABLISHING MESH...
                </>
              ) : (
                'AUTHENTICATE & ENTER REPUBLIC'
              )}
            </button>
          </div>
        )}

        <footer className="text-center text-[10px] text-slate-500 font-mono tracking-widest">
          PROJECT BAZAAR // NEO PROTOCOL v2.3
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-mono w-full max-w-[384px] mx-auto pb-24 space-y-4">
      
      {/* Live Telemetry Header */}
      <header className="border-b border-cyan-500/20 pb-3 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                {meshData.status === 'SYNCED' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${meshData.status === 'SYNCED' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              </span>
              NEO-SYNC {meshData.status}
            </div>
            <h1 className="text-lg font-bold text-slate-100 mt-1">Bazaar Master Node</h1>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">UPTIME SHIELD</span>
            <div className="text-xs font-bold text-cyan-400">91.59%</div>
          </div>
        </div>
      </header>

      {/* 🎛️ MASTER MESH SWITCH EMBEDDED DIRECTLY IN DASHBOARD */}
      <div className="w-full">
        <MasterMeshSwitch />
      </div>

      {/* Structured Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 uppercase">NETWORK PROTOCOL</span>
          <span className="text-cyan-400 font-bold font-mono text-sm">{meshData.protocol}</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 uppercase">LATEST LEDGER</span>
          <span className="text-emerald-400 font-bold font-mono text-xs">{meshData.ledger}</span>
        </div>
        
        {/* 🛡️ DYNAMIC VAULT SYNC MATRIX */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 uppercase">VAULT SYNC</span>
          <span className="text-amber-400 font-bold font-mono text-xs">3,140.90 {piSymbol}</span>
        </div>
        
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 uppercase">PIONEER IDENTITY</span>
          <span className="text-slate-100 font-bold font-mono text-xs truncate">
            @{pioneerId ? pioneerId.toUpperCase() : 'UNKNOWN_NODE'}
          </span>
        </div>
      </div>

      {/* Quick Sector Shortcuts */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-colors rounded-lg flex flex-col gap-1">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200">MESH Config</span>
          <span className="text-[10px] text-slate-400">Node Logic</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors rounded-lg flex flex-col gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">E-Network</span>
          <span className="text-[10px] text-slate-400">Bridge Ready</span>
        </div>
      </div>

      {/* Disconnect / Flush RAM Button */}
      <button
        onClick={disconnectNode}
        className="w-full mt-2 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
      >
        <LogOut className="w-4 h-4" /> DISCONNECT NODE
      </button>

    </div>
  );
}