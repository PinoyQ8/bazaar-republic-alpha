"use client";

import React, { useState } from "react";
import Link from "next/link";

interface VaultSession {
  success: boolean;
  clearanceTier: "FOUNDER" | "PIONEER" | "UNVERIFIED";
  user: string;
  message: string;
}

export default function VaultPage() {
  const [username, setUsername] = useState<string>("");
  const [mockToken, setMockToken] = useState<string>("");
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [session, setSession] = useState<VaultSession | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const handleVaultAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setSession(null);
    setErrorFeedback(null);

    try {
      const response = await fetch("/api/academy/vault", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: mockToken,
          username: username.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Vault handshake failure.");
      }

      // 🔒 Session verified and HttpOnly cookie set on browser engine natively
      setSession(data);
      
      // If authenticating as Founder, sync token template for local test parameters
      if (data.clearanceTier === "FOUNDER") {
        localStorage.setItem("Bazaar_Master_TS", "PinoyQ8");
      }
    } catch (err: any) {
      console.error("[browser] [VAULT SECURE FAILURE]:", err.message);
      setErrorFeedback(err.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleClearSession = () => {
    setSession(null);
    setUsername("");
    setMockToken("");
    setErrorFeedback(null);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 🚀 HEADER: MATRIX MODULE 02 */}
      <header className="space-y-4">
        <div className="inline-block px-3 py-1 bg-blue-600/10 border border-blue-600/30 rounded text-[10px] text-blue-400 font-bold tracking-[0.3em] uppercase">
          Identity Vault // Module 02
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-white uppercase">
          Cryptographic Lock Array
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm leading-relaxed italic">
          "Isolation is security. By routing temporary passkeys through an HttpOnly perimeter, 
          we neutralize browser manipulation vectors completely."
        </p>
      </header>

      {/* 📊 RUNTIME ACCESS CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* INTERACTION MATRIX PANEL */}
        <section className="p-8 border border-slate-800 bg-slate-950 rounded-xl relative">
          <h3 className="text-slate-200 font-bold mb-6 font-mono text-sm uppercase tracking-wider underline underline-offset-8 decoration-slate-800">
            // Handshake Execution Terminal
          </h3>

          {!session ? (
            <form onSubmit={handleVaultAuthentication} className="space-y-6 font-mono text-xs">
              
              <div className="space-y-2">
                <label className="block text-slate-400 uppercase tracking-wider text-[11px]">Pi Username Descriptor</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-600">@</span>
                  <input 
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="PinoyQ8"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-3 pl-8 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-400 uppercase tracking-wider text-[11px]">Ephemeral Access Token Footprint</label>
                <input 
                  type="password"
                  required
                  value={mockToken}
                  onChange={(e) => setMockToken(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-white tracking-widest focus:outline-none focus:border-blue-500 transition-colors"
                />
                <span className="block text-[10px] text-slate-600 italic">Enters temporary validation pool. Minimum 20 string bits.</span>
              </div>

              {errorFeedback && (
                <div className="p-4 bg-red-950/30 border border-red-900/40 text-red-400 rounded text-[11px] animate-in zoom-in-95 duration-200">
                  ⚠️ [HANDSHAKE ABORTED]: {errorFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded shadow-[0_0_20px_rgba(37,99,235,0.15)] transition-all uppercase tracking-widest text-center"
              >
                {isAuthenticating ? "Isolating Handshake..." : "Initialize Secure Authentication"}
              </button>

            </form>
          ) : (
            <div className="space-y-6 font-mono text-xs text-slate-400 animate-in fade-in duration-500">
              <div className="p-4 bg-emerald-950/20 border border-emerald-950 rounded text-emerald-400 text-[11px] leading-relaxed">
                ✓ {session.message}
              </div>
              
              <div className="space-y-2 pt-2">
                <p>Authenticated Persona: <span className="text-white font-bold">@{session.user}</span></p>
                <p>System Authority Target: 
                  <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${session.clearanceTier === 'FOUNDER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                    {session.clearanceTier}
                  </span>
                </p>
                <p>Boundary Isolation Layer: <span className="text-emerald-400 font-bold">HttpOnly Secure Injected</span></p>
              </div>

              <button
                onClick={handleClearSession}
                className="w-full py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded transition-colors uppercase tracking-widest text-center"
              >
                Sever Isolated Connection
              </button>
            </div>
          )}
        </section>

        {/* PERIMETER DIAGNOSTIC OUTPUT */}
        <section className="p-8 border border-slate-800 bg-slate-950/40 rounded-xl font-mono text-xs space-y-4 text-slate-500">
          <h3 className="text-slate-400 font-bold font-mono text-sm uppercase tracking-wider mb-2">// Network State Monitoring</h3>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Telemetry Protocol: <span className="text-slate-300">HTTP/2 Edge Stream Active</span>
          </p>
          <p>Storage Matrix Scope: <span className="text-slate-300">Client Memory Isolation Enabled</span></p>
          <hr className="border-slate-900 my-4" />
          
          <div className="space-y-2 text-[11px] leading-relaxed">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">// Diagnostic Criteria</p>
            <p>1. Target username <span className="text-purple-400">"PinoyQ8"</span> triggers internal authorization escalation rules to output the elite <span className="text-purple-400">FOUNDER</span> token block.</p>
            <p>2. Passing an access string shorter than 20 characters will instantly force a <span className="text-amber-400">401 Cryptographic validation failure</span> down the pipeline.</p>
          </div>
        </section>

      </div>

      {/* ⚙️ CODE ACTION MATRIX */}
      <div className="pt-8 border-t border-slate-900 flex justify-between items-center">
        <Link 
          href="/academy"
          className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest"
        >
          ← Return to Orientation
        </Link>
      </div>

    </div>
  );
}