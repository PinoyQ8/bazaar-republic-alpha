"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface VaultSession {
  success: boolean;
  clearanceTier: "FOUNDER" | "PIONEER" | "UNVERIFIED";
  user: string;
  message: string;
}

export default function VaultPage() {
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [session, setSession] = useState<VaultSession | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState<boolean>(false);

  // Initialize the SDK strictly on client mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi) {
      try {
        window.Pi.init({ version: "2.0", sandbox: process.env.NODE_ENV !== "production" });
        setSdkLoaded(true);
        console.log("[MESH-VAULT] Pi SDK Initialized Successfully.");
      } catch (err) {
        console.warn("[MESH-VAULT] SDK Initialization skipped or already bound.");
        setSdkLoaded(true); // Assume bound if error thrown on re-init
      }
    }
  }, []);

  const executePiHandshake = async () => {
    setIsAuthenticating(true);
    setSession(null);
    setErrorFeedback(null);

    try {
      if (!window.Pi) throw new Error("Pi SDK offline. Handshake must occur inside the Pi Browser ecosystem.");

      // 1. Trigger Native Pi Browser Authentication Popup
      console.log("[MESH-VAULT] Requesting cryptographic signature from Pi OS...");
      const scopes = ['username'];
      const onIncompletePaymentFound = (payment: any) => { console.log("Incomplete payment intercept:", payment); };
      
      const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      
      // 2. Transmit extracted payload to our secure HttpOnly API Gateway
      const response = await fetch("/api/academy/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: authResult.accessToken,
          username: authResult.user.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Vault gateway rejected the ecosystem signature.");
      }

      // 3. Lock State
      setSession(data);
      
      if (data.clearanceTier === "FOUNDER") {
        localStorage.setItem("Bazaar_Master_TS", "PinoyQ8");
      }

    } catch (err: any) {
      console.error("[browser] [VAULT SECURE FAILURE]:", err);
      setErrorFeedback(err.message || "Ecosystem handshake failure.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleClearSession = () => {
    setSession(null);
    setErrorFeedback(null);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 🚀 HEADER */}
      <header className="space-y-4">
        <div className="inline-block px-3 py-1 bg-blue-600/10 border border-blue-600/30 rounded text-[10px] text-blue-400 font-bold tracking-[0.3em] uppercase">
          Identity Vault // Module 02
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-white uppercase">
          Ecosystem Handshake
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm leading-relaxed italic">
          "Direct cryptographic integration. We no longer ask for credentials; we extract verified signatures directly from the blockchain UI."
        </p>
      </header>

      {/* 📊 RUNTIME ACCESS CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* INTERACTION MATRIX PANEL */}
        <section className="p-8 border border-slate-800 bg-slate-950 rounded-xl relative">
          <h3 className="text-slate-200 font-bold mb-6 font-mono text-sm uppercase tracking-wider underline underline-offset-8 decoration-slate-800">
            // Pi SDK Authentication Node
          </h3>

          {!session ? (
            <div className="space-y-6 font-mono text-xs">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded space-y-2">
                <p className="text-slate-400">SDK Status: {sdkLoaded ? <span className="text-emerald-400 font-bold">ONLINE</span> : <span className="text-amber-400 animate-pulse">INITIALIZING...</span>}</p>
                <p className="text-slate-400">Protocol: Native Window Intercept</p>
                <p className="text-slate-500 text-[10px] italic pt-2">Requires execution within the verified Pi Browser layout.</p>
              </div>

              {errorFeedback && (
                <div className="p-4 bg-red-950/30 border border-red-900/40 text-red-400 rounded text-[11px] animate-in zoom-in-95 duration-200">
                  ⚠️ [HANDSHAKE ABORTED]: {errorFeedback}
                </div>
              )}

              <button
                onClick={executePiHandshake}
                disabled={isAuthenticating || !sdkLoaded}
                className="w-full py-4 bg-[#f4b300] hover:bg-[#e0a800] disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-extrabold rounded shadow-[0_0_20px_rgba(244,179,0,0.2)] transition-all uppercase tracking-widest text-center"
              >
                {isAuthenticating ? "Extracting Signature..." : "Verify Identity via Pi Network"}
              </button>
            </div>
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
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            Telemetry Protocol: <span className="text-slate-300">Pi SDK / HTTP/2 Bridge</span>
          </p>
          <hr className="border-slate-900 my-4" />
          
          <div className="space-y-2 text-[11px] leading-relaxed">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">// Diagnostic Criteria</p>
            <p>1. Executing the native bridge triggers <span className="text-blue-400">window.Pi.authenticate()</span>, forcing the device OS to extract the cryptographic payload.</p>
            <p>2. Attempting extraction outside the official Pi Browser triggers a graceful OS boundary lock.</p>
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