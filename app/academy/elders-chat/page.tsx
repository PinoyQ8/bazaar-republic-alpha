"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CircleOfEldersNode() {
  const [mounted, setMounted] = useState(false);
  const [activePioneer, setActivePioneer] = useState<string>("");
  const [tier, setTier] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const user = localStorage.getItem("MESH_GENESIS_USER");
    const roles = JSON.parse(localStorage.getItem("MESH_ACCESS") || "[]");
    const userTier = localStorage.getItem("MESH_TIER") || "";

    if (!user || !roles.includes("SECURITY_CIRCLE")) {
      router.push("/academy");
    } else {
      setActivePioneer(user);
      setTier(userTier);
    }
  }, [router]);

  if (!mounted || !activePioneer) return null;

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 font-mono text-slate-300 relative overflow-hidden">
      
      {/* 🔮 BACKGROUND MESH LAYER */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none"></div>

      {/* 🏛️ ELDERS SECTOR HEADER */}
      <header className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-blue-900/40 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]"></span>
            </span>
            <h2 className="text-[10px] text-blue-400 tracking-[0.5em] uppercase font-bold">Genesis Alpha Council</h2>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-slate-100 to-slate-500 tracking-tighter uppercase">
            Circle of Elders
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-slate-600 uppercase mb-1">Decentralized Trust Level</p>
            <p className="text-xs text-green-400 font-bold uppercase tracking-widest">11/11 Nodes Required</p>
          </div>
          <Link href="/academy" className="px-4 py-2 border border-slate-800 rounded-lg bg-slate-900/50 hover:bg-slate-800 transition-colors text-[10px] text-slate-400 uppercase tracking-widest hover:text-white">
            Evacuate Sector
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 🏛️ THE ELDER MANIFEST (Sidebar) */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="p-1 rounded-2xl bg-linear-to-b from-blue-900/20 to-transparent border border-slate-800">
            <div className="bg-slate-950 p-5 rounded-[14px]">
              <h3 className="text-[10px] text-blue-500 uppercase tracking-[0.3em] mb-4 border-b border-slate-800 pb-2 flex justify-between">
                <span>Active Elders</span>
                <span className="text-slate-600">3/11</span>
              </h3>
              
              <ul className="space-y-4">
                {/* Active Founder Node */}
                <li className="flex items-center gap-3 p-2 rounded-lg bg-blue-900/10 border border-blue-900/30">
                  <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-xs">
                    {activePioneer.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{activePioneer} <span className="text-[8px] text-blue-500 border border-blue-900 px-1 rounded ml-1">SYNCED</span></p>
                    <p className="text-[8px] text-slate-500 uppercase">{tier}</p>
                  </div>
                </li>
                
                {/* Known Offline/Idle Nodes */}
                <li className="flex items-center gap-3 p-2 opacity-50 grayscale">
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 font-bold text-xs">M</div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">Mommydors</p>
                    <p className="text-[8px] text-slate-600 uppercase">Security Circle</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 p-2 opacity-50 grayscale">
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 font-bold text-xs">N</div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">ncframos</p>
                    <p className="text-[8px] text-slate-600 uppercase">Security Circle</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* 🏛️ THE CONSENSUS TERMINAL */}
        <section className="lg:col-span-9 flex flex-col h-[70vh] rounded-2xl border border-blue-900/30 bg-slate-950/80 backdrop-blur-md shadow-2xl relative overflow-hidden">
          
          {/* 🏛️ Optimized Terminal Scanlines Effect */}
<div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_4px,3px_100%] z-50 opacity-20"></div>

          {/* Chat History Area */}
          <div className="flex-1 p-8 space-y-6 overflow-y-auto relative z-20">
            <div className="flex justify-center mb-8">
              <span className="px-4 py-1 rounded-full bg-slate-900 border border-slate-800 text-[9px] text-slate-500 uppercase tracking-widest">
                Logic Session: {new Date().toLocaleDateString()}
              </span>
            </div>

            {/* System Protocol Message */}
            <div className="max-w-2xl border-l-2 border-blue-600 pl-4 bg-linear-to-r from-blue-900/10 to-transparent p-3 rounded-r-lg">
              <p className="text-[10px] text-blue-500 uppercase tracking-widest mb-1 font-bold">Protocol Adjudicator</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Welcome to the Circle of Elders. Any logic submitted to this channel bypasses the public MESH and is immediately entered into the Alpha Registry for consensus. Acknowledge and proceed.
              </p>
            </div>
          </div>

          {/* Command Input Forge */}
          <div className="p-6 border-t border-blue-900/30 bg-slate-950 z-20">
            <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-2 focus-within:border-blue-500/50 transition-colors shadow-inner">
              <span className="text-blue-500 font-bold pl-3">{">"}</span>
              <input 
                disabled
                placeholder="Consensus transmission disabled in current MESH-SCAN phase..." 
                className="flex-1 bg-transparent border-none px-2 py-2 text-xs text-blue-300 font-mono focus:outline-none focus:ring-0 placeholder-slate-600"
              />
              <button disabled className="px-6 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-600/30 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
                Broadcast
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}