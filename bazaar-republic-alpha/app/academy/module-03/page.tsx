"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import ZeroTrustTerminal from "@/app/components/ZeroTrustTerminal"; // Adjust path if needed

export default function ModuleThreePage() {
  const { pioneer } = useAuth();

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 selection:bg-green-500 selection:text-black">
      
      {/* 🚀 HEADER: SECTOR IDENTITY */}
      <header className="w-full max-w-2xl mb-8 space-y-2 text-center">
        <div className="inline-block px-2 py-0.5 bg-green-950/40 border border-green-700/40 rounded-sm text-[9px] text-green-400 font-bold tracking-[0.2em] uppercase">
          Architecture Module 03
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
          Zero-Trust Database Lock
        </h1>
        <p className="text-green-400/80 text-[11px] leading-relaxed">
          Establish a permanent cryptographic link with the Neon Database Cluster before proceeding to the Genesis Capstone.
        </p>
      </header>

      {/* 🛡️ INJECTED COMPONENT: THE TERMINAL */}
      <ZeroTrustTerminal pioneerUid={pioneer?.username || "UNVERIFIED_NODE"} />

    </div>
  );
}