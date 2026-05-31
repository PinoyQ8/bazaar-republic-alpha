// Route: /app/page.tsx
// Logic: Academy Hero Sector & MESH-Hardened Terminal Handshake

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from 'next/link';

export default function RepublicHeroSector() {
  const router = useRouter();
  
  // 🛡️ ROOT NODE BYPASS
  const context = useAuth() as any;
  const pioneer = context.pioneer;
  const login = context.login;
  const isHydrated = context.isHydrated as boolean;

  const [isSyncing, setIsSyncing] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>(["[SYSTEM] Awaiting Node Uplink..."]);

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev, msg]);
  };

  // 🛡️ TIMING RETRY LOOP: Ensure Pi SDK initializes
  useEffect(() => {
    let checkCount = 0;
    
    const initializePiSDK = () => {
      if (typeof window !== 'undefined' && (window as any).Pi) {
        try {
          const pi = (window as any).Pi;
          // Sandbox toggles based on active deployment Triad
          const isLiveMainnet = window.location.hostname.includes("project-bazaar-mainnet");
          pi.init({ version: "2.0", sandbox: !isLiveMainnet });
          
          (window as any).__PI_INITIALIZED__ = true;
          addLog(`[MESH-BRIDGE] 🟢 Pi SDK Ready. Sandbox: ${!isLiveMainnet}`);
          return true;
        } catch (err) {
          return true; 
        }
      }
      return false;
    };

    if (initializePiSDK()) return;

    const syncInterval = setInterval(() => {
      checkCount++;
      if (initializePiSDK() || checkCount > 20) {
        clearInterval(syncInterval);
        if (checkCount > 20) addLog("[CRITICAL] Pi SDK load timeout. Check layout script.");
      }
    }, 250);

    return () => clearInterval(syncInterval);
  }, []);

  // 🛡️ ENFORCE RIGID Pi SDK HANDSHAKE
  const handleHandshake = async () => {
    if (typeof window === 'undefined' || !(window as any).__PI_INITIALIZED__) {
      addLog("[ERROR] Pi SDK offline. Launch from Pi Browser.");
      return;
    }

    setIsSyncing(true);
    addLog("[UPLINK] Initiating secure native Pi handshake...");

    try {
      if (pioneer?.isAuthenticated) {
        addLog("[SYNC] Session active. Routing to Command Dashboard...");
        setTimeout(() => router.push("/dashboard"), 800);
        return;
      }

      // Phase 1: Native Pi Authentication
      const pi = (window as any).Pi;
      const authResults = await pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
      
      addLog(`[SUCCESS] Auth confirmed for Pioneer: @${authResults.user.username}`);
      addLog("[UPLINK] Securing payload to DAO Ledger...");

      // Phase 2: Secure API Handshake (Transaction Sector)
      const masterTS = Date.now();
      const res = await fetch("/api/mesh-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "verify-token", 
          accessToken: authResults.accessToken,
          uid: authResults.user.uid
        }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Vault check failed.");
      }

      // Phase 3: Local Storage Binding & Context Login
      localStorage.setItem("MASTER_TS", masterTS.toString());
      
      addLog(`[SUCCESS] MESH Ledger Synced. Vault locked.`);
      addLog(`[VISION] The Academy Vault awaits. Forge the future.`);
      addLog(`[SYS] Booting E-Network modules...`);

      // Hold for 2.5 seconds so the Pioneer absorbs the Vision before routing
      setTimeout(async () => {
        // Feed the REAL Pi UID to your AuthContext instead of genesis-100
        await login(authResults.user.uid, "PIONEER");
        router.push("/dashboard");
      }, 2500);

    } catch (error: any) {
      console.error("[MESH-FRACTURE] Handshake Failed:", error);
      addLog(`[CRITICAL] Network bridge failed: ${error.message || "Session Rejected"}`);
      setIsSyncing(false);
    }
  };

  const onIncompletePaymentFound = (payment: any) => {
    addLog("[WARNING] Orphaned payment detected. Protocol 24 required.");
  };

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <span className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 font-mono text-slate-300">
      {/* 🛡️ S23 VIEWPORT LOCK FOR PROTOCOL FORGE */}
      <div className="w-full max-w-[384px] text-center flex flex-col items-center">
        <h1 className="text-3xl text-emerald-500 font-bold mb-2 tracking-widest uppercase">Project Bazaar</h1>
        <p className="text-slate-400 mb-6 text-sm leading-relaxed border-b border-slate-800 pb-4 w-full">
          The Academy Vault. Lock your stake. Secure the network. Forge the future.
        </p>

        {/* 🛡️ IN-ENGINE TERMINAL VISUALIZER */}
        <div className="w-full bg-black border border-slate-800 text-left p-3 mb-6 h-48 overflow-y-auto text-xs space-y-2 rounded shadow-inner">
          {terminalLogs.map((log, index) => (
            <div key={index} className={log.includes("[ERROR]") || log.includes("[CRITICAL]") ? "text-red-500" : log.includes("[VISION]") ? "text-emerald-400 font-bold" : "text-slate-500"}>
              {log}
            </div>
          ))}
        </div>

        <button 
          onClick={handleHandshake}
          disabled={isSyncing}
          className="w-full bg-slate-900 border border-emerald-500/50 text-emerald-400 px-8 py-3 rounded uppercase tracking-widest hover:bg-emerald-950 hover:border-emerald-400 transition-all disabled:opacity-50"
        >
          {isSyncing 
            ? "EXECUTING HANDSHAKE..." 
            : pioneer?.isAuthenticated 
              ? "ENTER COMMAND DASHBOARD" 
              : "INITIALIZE PI NODE"}
        </button>

        <a href="/log-in" style={{ textDecoration: 'none' }}>
  <button style={{ 
    padding: '16px 32px', backgroundColor: '#00d28a', color: '#000', 
    fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer',
    textTransform: 'uppercase', letterSpacing: '2px', marginTop: '24px'
  }}>
    Initialize Sync (Log In)
  </button>
</a>

        {pioneer?.isAuthenticated && (
          <p className="mt-4 text-xs text-slate-500 tracking-wider">
            Identity Confirmed: <span className="text-slate-300">{pioneer.uid || "PioneerNode"}</span>
          </p>
        )}
      </div>
    </div>
  );
}