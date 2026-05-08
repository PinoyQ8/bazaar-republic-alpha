"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SeniorChatNode() {
  const [mounted, setMounted] = useState(false);
  const [activePioneer, setActivePioneer] = useState<string>("");
  const [access, setAccess] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const user = localStorage.getItem("MESH_GENESIS_USER");
    const roles = JSON.parse(localStorage.getItem("MESH_ACCESS") || "[]");

    // 🛡️ SECURITY GATE: Check for SECURITY_CIRCLE key
    if (!user || !roles.includes("SECURITY_CIRCLE")) {
      console.error("ADJUDICATOR ALERT: UNAUTHORIZED ACCESS DETECTED.");
      router.push("/");
    } else {
      setActivePioneer(user);
      setAccess(roles);
    }
  }, [router]);

  if (!mounted || !activePioneer) return null;

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 font-mono">
      {/* 🛡️ SECTOR HEADER */}
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-8 border-b border-slate-900 pb-6">
        <div>
          <h2 className="text-[10px] text-blue-500 tracking-[0.4em] uppercase">Private Sector: Alpha</h2>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Senior Chat Node</h1>
        </div>
        <Link href="/academy" className="text-[10px] px-3 py-1.5 border border-slate-800 rounded hover:bg-slate-900 transition-colors text-slate-400">
          EXIT SECTOR
        </Link>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* 🛡️ ONLINE ADJUDICATORS */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/20">
            <h3 className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">Active Nodes</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-blue-400">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                {activePioneer} (You)
              </li>
              {/* Mock active users for Alpha visualization */}
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                Mommydors
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                ncframos
              </li>
            </ul>
          </div>
        </aside>

        {/* 🛡️ CHAT TERMINAL */}
        <section className="lg:col-span-3 flex flex-col h-[60vh] rounded-xl border border-blue-900/30 bg-slate-950 shadow-2xl relative overflow-hidden">
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="border-l-2 border-blue-600 pl-4">
              <p className="text-[10px] text-blue-500 uppercase mb-1">System Message [09:41]</p>
              <p className="text-sm text-slate-300">Welcome to the Alpha War Room. Secure logic channel initialized.</p>
            </div>
            
            {/* Message Placeholder */}
            <div className="text-center py-20">
              <p className="text-xs text-slate-700 uppercase tracking-[0.5em]">Awaiting Peer Signal...</p>
            </div>
          </div>

          {/* Input Forge */}
          <div className="p-4 border-t border-slate-900 bg-slate-900/30">
            <div className="flex gap-4">
              <input 
                disabled
                placeholder="MESSAGE LOGIC DISABLED IN ALPHA_0.1" 
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-500 font-mono focus:outline-none"
              />
              <button disabled className="px-4 py-2 bg-slate-800 text-slate-500 rounded-lg text-xs font-bold">SEND</button>
            </div>
          </div>
        </section>

      </main>

      {/* 🛡️ MESH LOGS */}
      <footer className="max-w-5xl mx-auto mt-8">
        <div className="p-4 bg-slate-950 border border-slate-900 rounded-lg">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest">
            Handshake: Verified | Access: {access.join(" + ")} | Node: X570_Alpha
          </p>
        </div>
      </footer>
    </div>
  );
}