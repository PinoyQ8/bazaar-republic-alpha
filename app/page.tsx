"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { verifyGenesisNode } from "./actions/verifyGenesis";

export default function RepublicHeroSector() {
  // 🛡️ COMPONENT STATES
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activePioneer, setActivePioneer] = useState("");
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // 🛡️ HYDRATION BRIDGE
  useEffect(() => {
    setMounted(true);
    const loggedUser = localStorage.getItem("MESH_GENESIS_USER");
    if (loggedUser) {
      setActivePioneer(loggedUser);
      setIsUnlocked(true);
    }
  }, []);

  // 🛡️ THE HANDSHAKE LOGIC
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError("");

    try {
      const response = await verifyGenesisNode(username, passcode);

      if (response.success && response.tier) {
        // 🛡️ Bypassing TypeScript inference with explicit assertions
        const validUsername = (response.username as string) || "";
        const validTier = (response.tier as string);
        const validAnchor = (response.anchor as string) || "GENESIS ALPHA";
        const validAccess = JSON.stringify(response.access || []);

        // BURN TO LOCAL RAM
        localStorage.setItem("MESH_GENESIS_USER", validUsername);
        localStorage.setItem("MESH_TIER", validTier);
        localStorage.setItem("MESH_ANCHOR", validAnchor);
        localStorage.setItem("MESH_ACCESS", validAccess);
        
        setActivePioneer(validUsername);
        setIsUnlocked(true);
      }
    } catch (err) {
      setError("BRIDGE CONNECTION FAILED.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!mounted) return null; 

  // ==========================================
  // 🔴 STATE: LOCKED
  // ==========================================
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="w-full max-w-md p-8 border border-blue-900/50 bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.1)] text-center relative overflow-hidden">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-mono text-2xl font-bold text-slate-100 tracking-widest mb-2">RESTRICTED SECTOR</h1>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="PI USERNAME"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-blue-400 rounded-lg font-mono text-center"
              disabled={isVerifying}
            />
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="PASSCODE"
              className={`w-full px-4 py-3 bg-slate-950 border ${error ? 'border-red-500' : 'border-slate-800'} text-blue-400 rounded-lg font-mono text-center`}
              disabled={isVerifying}
            />
            {error && <p className="text-red-500 text-xs font-mono animate-pulse">{error}</p>}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold rounded-lg transition-all"
            >
              {isVerifying ? "ADJUDICATING..." : "INITIALIZE BRIDGE"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🟢 STATE: UNLOCKED
  // ==========================================
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-mono text-slate-300 uppercase tracking-widest">Logged: {activePioneer}</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
          The <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-blue-600">Bazaar Republic</span>
        </h1>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/academy" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold rounded-lg">
            ENTER ACADEMY
          </Link>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="px-8 py-4 bg-transparent border border-slate-700 text-slate-300 font-mono font-bold rounded-lg"
          >
            FLUSH RAM
          </button>
        </div>
      </div>
    </div>
  );
}