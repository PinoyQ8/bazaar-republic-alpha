'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Zap, ArrowRight, Wallet, Activity, Database, Loader2, LogOut } from 'lucide-react';;

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
  
  const [meshData, setMeshData] = useState({
    status: 'SYNCING...',
    protocol: 'p--.-',
    ledger: '-------'
  });

  useEffect(() => {
    // Check for existing identity
    const activeStatus = localStorage.getItem('mesh_pioneer_active');
    const storedId = localStorage.getItem('mesh_pioneer_id');
    
    if (activeStatus === 'true' && storedId) {
      setPioneerId(storedId);
      setIsFirstTime(false);
    }
    
    const syncMesh = async () => {
      try {
        const res = await fetch('/api/mesh-scan');
        const data = await res.json();
        if (data.status === 'MESH_ACTIVE') {
          setMeshData({
            status: 'SYNCED',
            protocol: `p${data.telemetry.protocol_version}`,
            ledger: data.telemetry.latest_ledger.toLocaleString()
          });
        } else {
          setMeshData(prev => ({ ...prev, status: 'FAULT' }));
        }
      } catch (err) {
        setMeshData(prev => ({ ...prev, status: 'OFFLINE' }));
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
      // A. DESKTOP / NITRO 5 BYPASS
      // If we are not inside an iframe (Pi Sandbox), bypass the real SDK to prevent postMessage crashes during local dev.
      const isOutsideSandbox = window.self === window.top;
      
      if (process.env.NODE_ENV === 'development' && isOutsideSandbox) {
        console.warn('[MESH-FAULT] Operating outside Pi Sandbox. Using Dev Node bypass.');
        // Simulate a 1-second network delay for UI testing, then login
        setTimeout(() => finalizeLogin('BazaarDevNode'), 1000);
        return;
      }

      // B. STRICT SDK CHECK
      if (typeof window === 'undefined' || !window.Pi) {
        throw new Error('Pi SDK Missing. Ensure the SDK script is loaded in layout.tsx.');
      }

      // C. INITIALIZE PROTOCOL (This fixes your error)
      console.log('[MESH-SYNC] Initializing Pi SDK Sandbox...');
      window.Pi.init({ 
        version: "2.0", 
        sandbox: process.env.NODE_ENV !== 'production' 
      });

      // D. EXECUTE CRYPTOGRAPHIC AUTH
      const onIncompletePaymentFound = (payment: any) => {
        console.log('[MESH-SYNC] Incomplete payment detected:', payment);
      };

      const authResult = await window.Pi.authenticate(
        ['username', 'payments'],
        onIncompletePaymentFound
      );

      console.log('[MESH-SYNC] Handshake accepted by:', authResult.user.username);
      finalizeLogin(authResult.user.username);

    } catch (error) {
      console.error('[MESH-FAULT] Authentication rejected or failed:', error);
      setIsAuthenticating(false);
    }
  };

  const finalizeLogin = (username: string) => {
    localStorage.setItem('mesh_pioneer_active', 'true');
    localStorage.setItem('mesh_pioneer_id', username);
    localStorage.setItem('mesh_pioneer_ts', Date.now().toString());
    setPioneerId(username);
    setIsFirstTime(false);
    setIsAuthenticating(false);
  };

  // FLUSH RAM: Purge Identity & Reset Node
  const disconnectNode = () => {
    console.log('[MESH-SYNC] Initiating Node Disconnect (Flush RAM)...');
    localStorage.removeItem('mesh_pioneer_active');
    localStorage.removeItem('mesh_pioneer_id');
    localStorage.removeItem('mesh_pioneer_ts');
    
    setPioneerId(null);
    setOnboardingStep(1); // Reset Genesis Gate to Step 1
    setIsFirstTime(true); // Route back to Track 1
  };

  // TRACK 0: INITIALIZATION SHIELD
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-400 flex flex-col items-center justify-center font-mono text-xs w-full max-w-[384px] mx-auto">
        <Activity className="w-8 h-8 mb-4 animate-pulse text-emerald-500" />
        <span className="tracking-widest">INITIALIZING MESH PROTOCOL...</span>
      </div>
    );
  }

  // TRACK 1: FIRST-TIME PIONEER UI (Genesis Gate)
  if (isFirstTime) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-mono flex flex-col justify-between w-full max-w-[384px] mx-auto pb-24">
        <header className="pt-4 border-b border-cyan-500/20 pb-3">
          <div className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase">
            PROJECT BAZAAR // GENESIS GATE
          </div>
          <h1 className="text-xl font-extrabold text-slate-100 mt-1">Pioneer Activation</h1>
        </header>

        {/* Step 1: Protocol Welcome */}
        {onboardingStep === 1 && (
          <div className="space-y-4 my-auto">
            <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded-xl space-y-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
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
            <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded-xl space-y-3 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Wallet className="w-5 h-5" /> PI NETWORK HANDSHAKE
              </div>
              <p className="text-xs text-slate-300">
                Connect your Pi Wallet address to synchronize your balance with the Vault Sector.
              </p>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono flex justify-between">
                <span>SDK STATUS:</span>
                <span className="text-emerald-400 font-bold">READY</span>
              </div>
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

  // TRACK 2: RETURNING PIONEER UI (Master Dashboard)
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

      {/* Primary Pi Network Telemetry Card */}
      <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-xl space-y-3 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-500/10 blur-2xl rounded-full"></div>
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5"/> NETWORK PROTOCOL</span>
          <span className="text-emerald-400 font-bold">{meshData.protocol}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 flex items-center gap-1.5"><Database className="w-3.5 h-3.5"/> LATEST LEDGER</span>
          <span className="text-slate-200 font-bold">{meshData.ledger}</span>
        </div>
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">VAULT SYNC</span>
          <span className="text-cyan-400 font-bold">3,140.90 π</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">PIONEER IDENTITY</span>
          <span className="text-cyan-400 font-bold tracking-widest">
            @{pioneerId ? pioneerId.toUpperCase() : 'UNKNOWN_NODE'}
          </span>
        </div>
      </div> {/* <-- THIS CLOSING TAG WAS MISSING */}

      {/* Quick Sector Shortcuts */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* ... existing shortcut buttons ... */}
      </div>

      {/* Disconnect / Flush RAM Button */}
      <button
        onClick={disconnectNode}
        className="w-full mt-4 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
      >
        <LogOut className="w-4 h-4" /> DISCONNECT NODE
      </button>
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
    </div>
  );
}