"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RepublicHeroSector() {
  const router = useRouter();
  const { pioneer, login, isHydrated } = useAuth() as any; // Context bridge
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>(["[SYSTEM] Awaiting Node Uplink..."]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 🛡️ MESH-SCAN: Auto-scroll terminal to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev, msg]);
  };

  const handleHandshake = async () => {
    setIsSyncing(true);
    addLog("[UPLINK] Initiating secure handshake to Sector 01...");

    try {
      if (pioneer?.isAuthenticated) {
        addLog("[SYNC] Session active. Routing to Command Dashboard...");
        setTimeout(() => router.push("/dashboard"), 800);
        return;
      }

      const masterTS = Date.now();
      const nodeId = "genesis-100";

      const res = await fetch("/api/genesis-handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, masterTS }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        addLog(`[ERROR] MESH Shield Action: ${data.error}`);
        setIsSyncing(false);
        return;
      }

      localStorage.setItem("ACADEMY_PAYLOAD", JSON.stringify(data.payload));
      localStorage.setItem("MASTER_TS", masterTS.toString());

      addLog(`[SUCCESS] Handshake Verified.`);
      addLog(`[VISION] ${data.payload.academy_baseline.vision}`);
      addLog(`[SYS] Locking vault. Booting E-Network modules...`);

      setTimeout(async () => {
        await login(nodeId, "PIONEER");
        router.push("/dashboard");
      }, 2500);

    } catch (error) {
      console.error("[MESH-FRACTURE] Handshake Failed:", error);
      addLog("[CRITICAL] Node fracture detected. Network bridge failed.");
      setIsSyncing(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <span className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-4 font-mono text-zinc-300">
      {/* 🛡️ S23 VIEWPORT LOCK */}
      <div className="w-full max-w-[384px] text-center flex flex-col items-center">
        <h1 className="text-3xl text-emerald-500 font-bold mb-2 tracking-widest uppercase">Project Bazaar</h1>
        <p className="text-zinc-400 mb-6 text-sm leading-relaxed border-b border-zinc-800 pb-4 w-full">
          The Academy Vault. Lock your stake. Secure the network. Forge the future.
        </p>

        {/* 🛡️ IN-ENGINE TERMINAL VISUALIZER */}
        <div ref={scrollRef} className="w-full bg-black border border-zinc-800 text-left p-3 mb-6 h-48 overflow-y-auto text-xs space-y-2 rounded shadow-inner">
          {terminalLogs.map((log, index) => (
            <div key={index} className={
              log.includes("[ERROR]") || log.includes("[CRITICAL]") ? "text-red-500" : 
              log.includes("[VISION]") ? "text-emerald-400 font-bold" : 
              "text-zinc-500"
            }>
              {log}
            </div>
          ))}
        </div>

        <button 
          onClick={handleHandshake}
          disabled={isSyncing}
          className="w-full bg-zinc-900 border border-emerald-500/50 text-emerald-400 px-8 py-3 rounded uppercase tracking-widest hover:bg-emerald-950 hover:border-emerald-400 transition-all disabled:opacity-50"
        >
          {isSyncing ? "EXECUTING HANDSHAKE..." : pioneer?.isAuthenticated ? "ENTER COMMAND DASHBOARD" : "INITIALIZE PI NODE"}
        </button>

        {pioneer?.isAuthenticated && (
          <p className="mt-4 text-xs text-zinc-500 tracking-wider">
            Identity Confirmed: <span className="text-zinc-300">{pioneer.username || "PioneerNode"}</span>
          </p>
        )}
      </div>
    </div>
  );
}