"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation"; // 🛡️ INJECTED: usePathname
import { verifyGenesisNode } from "./actions/verifyGenesis";
import { useAuth } from "@/context/AuthContext";

export default function RepublicHeroSector() {
  const { pioneer, login } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // 🛡️ INJECTED: Capture active route

  // 🛡️ LOGIC PURITY: Separation of states
  const [isVerifying, setIsVerifying] = useState(false);
  const [activePioneer, setActivePioneer] = useState("");
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  // We rely on the AuthContext (pioneer object) for absolute truth, not localStorage.
  const isUnlocked = !!pioneer?.isAuthenticated; 
  
  // 🛡️ THE WHITELIST BYPASS
  const isVaultSector = pathname === "/academy/vault";

  useEffect(() => {
    setMounted(true);
    // Display data only. Never use this to grant access.
    const cachedUser = localStorage.getItem("MESH_GENESIS_USER");
    if (cachedUser) {
      setActivePioneer(cachedUser);
    }
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError("");

    try {
      // 🛡️ THE BRIDGE: Payload sent to the Adjudicator
      const response = await verifyGenesisNode(username, passcode);

      if (response.success && response.tier) {
        const validUsername = (response.username as string) || username;
        
        // Caching for visual UI only (NOT for security routing)
        localStorage.setItem("MESH_GENESIS_USER", validUsername);
        localStorage.setItem("MESH_TIER", response.tier as string);
        localStorage.setItem("MESH_ANCHOR", (response.anchor as string) || "GENESIS ALPHA");
        
        setActivePioneer(validUsername);
        
        // 🔒 Sync the AuthContext & trigger the HttpOnly cookie via backend
        await login(validUsername, response.tier); 
        
        // Let the middleware handle the automatic bounce to the Academy
        router.push('/academy');
      } else {
        setError("ADJUDICATOR: CREDENTIALS REJECTED.");
      }
    } catch (err) {
      setError("FATAL: BRIDGE CONNECTION FRACTURED.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFlush = async () => {
    try {
      // 🛡️ MEMORY WIPE: Destroy the HttpOnly Cookie on the server
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.clear();
      window.location.href = '/'; // Hard reload to clear active memory
    } catch (err) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!mounted) return null;

  // 🛑 ZERO-TRUST PERIMETER ACTIVE (WITH VAULT BYPASS)
  // If they are NOT unlocked AND they are NOT at the vault, drop the blast doors.
  if (!isUnlocked && !isVaultSector) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in duration-700">
        <div className="w-full max-w-[350px] p-8 border border-blue-900/50 bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.1)] text-center relative overflow-hidden">
          
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)] relative">
            {/* Radar Sweep Effect */}
            <div className={`absolute inset-0 rounded-full border-t-2 border-blue-500 ${isVerifying ? 'animate-spin' : ''}`}></div>
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h1 className="font-mono text-xl font-bold text-slate-100 tracking-widest mb-2 uppercase">
            Restricted Sector
          </h1>
          <p className="text-[10px] font-mono text-slate-500 mb-6 tracking-tighter italic">
            X570 Node: Manual Handshake Required
          </p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="PI USERNAME"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-blue-400 rounded-lg font-mono text-center text-sm focus:border-blue-500 outline-hidden transition-colors placeholder:text-slate-700"
              disabled={isVerifying}
              required
            />
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="PASSCODE"
              className={`w-full px-4 py-3 bg-slate-950 border ${error ? 'border-red-500/50' : 'border-slate-800'} text-blue-400 rounded-lg font-mono text-center text-sm focus:border-blue-500 outline-hidden transition-colors placeholder:text-slate-700`}
              disabled={isVerifying}
              required
            />
            {error && (
              <p className="text-red-500 text-[9px] font-mono animate-pulse uppercase tracking-widest border border-red-900/50 bg-red-950/20 py-1.5 rounded">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isVerifying || !username || !passcode}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-mono font-bold rounded-lg transition-all text-sm uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.2)]"
            >
              {isVerifying ? "Adjudicating..." : "Initialize Bridge"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ✅ VAULT KEY VERIFIED: HERO SECTOR ACTIVE
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="z-10 max-w-4xl mx-auto space-y-8">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-700 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          <span className="text-[10px] font-mono text-slate-300 uppercase tracking-[0.2em]">
            Genesis Node Online: <span className="text-blue-400 font-bold">{activePioneer || pioneer?.username}</span>
          </span>
        </div>
        
        <div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white mb-4 uppercase leading-none">
            The <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-blue-700 drop-shadow-lg">Bazaar Republic</span>
          </h1>
          <p className="text-slate-400 font-mono text-sm max-w-xl mx-auto">
            "Sovereignty requires architecture. Welcome back to the E-Network."
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/academy" className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold rounded-lg transition-all active:scale-95 text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            Enter Academy
          </Link>
          <button 
            onClick={handleFlush}
            className="w-full sm:w-auto px-10 py-4 bg-transparent border border-slate-700 text-slate-400 font-mono font-bold rounded-lg hover:bg-slate-800 hover:text-white transition-all text-sm uppercase tracking-widest"
          >
            Flush RAM
          </button>
        </div>
      </div>
    </div>
  );
}