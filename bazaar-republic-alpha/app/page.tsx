"use client";

import { useState } from "react";
import { useMeshStatus } from "@/app/components/MeshInitializer";
import { Loader2, Terminal, ShieldCheck, Menu, X } from "lucide-react";
import BazaarGate from "@/components/auth/BazaarGate";
import Link from "next/link";

export default function HomePage() {
  // 🛡️ ADJUDICATOR: Ensure useMeshStatus provides isPiReady and isAuthenticated
  const { isPiReady, isAuthenticated } = useMeshStatus();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. BOOT SEQUENCE (Loading)
  if (!isPiReady) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] w-full">
        <div className="border border-amber-500/30 bg-neutral-900/50 p-8 rounded flex flex-col items-center max-w-sm w-full text-center space-y-4 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs font-mono tracking-widest text-amber-500 uppercase animate-pulse">
            Initializing MESH...
          </p>
          <div className="w-full text-[10px] text-neutral-500 border-t border-neutral-800 pt-3 flex justify-between uppercase font-mono">
            <span>Node: X570-Taichi</span>
            <span>Status: Syncing</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. SECURITY GATE (Auth Check)
  // If not authenticated, we force the Pioneer through the BazaarGate.
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] w-full">
        <BazaarGate />
      </div>
    );
  }

  // 3. COMMAND NODE (Authenticated Dashboard)
  return (
    <div className="space-y-6 font-mono animate-in fade-in duration-500 relative">
      
      <header className="border-b border-neutral-800 pb-4 flex justify-between items-center relative">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Terminal className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-bold text-amber-500 tracking-widest uppercase">
              Bazaar Republic
            </h1>
          </div>
          <p className="text-xs text-neutral-500 uppercase tracking-widest">
            E-Network Command Node • Protocol 26.1 Active
          </p>
        </div>
        
        {/* Desktop Sync Badge */}
        <div className="hidden md:flex items-center space-x-2 bg-emerald-950/30 border border-emerald-900/50 px-3 py-1 rounded">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Mesh Synced</span>
        </div>

        {/* Mobile Burger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile Slide-Down / Popover Navigation Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-neutral-950 border border-neutral-800 backdrop-blur-xl p-4 flex flex-col space-y-3 shadow-2xl z-50 rounded">
            <div className="flex items-center space-x-2 pb-2 border-b border-neutral-800 text-[10px] text-emerald-500 uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mesh Synced (Node Active)</span>
            </div>
            <Link 
              href="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-amber-400 text-xs py-2 px-3 rounded bg-amber-500/10 border border-amber-500/30 font-bold"
            >
              📊 Command Node (Dashboard)
            </Link>
            <Link 
              href="/mesh-scan" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-neutral-400 hover:text-amber-400 text-xs py-2 px-3 rounded hover:bg-neutral-900 transition-colors"
            >
              🛡️ MESH-SCAN Diagnostics
            </Link>
            <Link 
              href="/alpha-track" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-neutral-400 hover:text-amber-400 text-xs py-2 px-3 rounded hover:bg-neutral-900 transition-colors"
            >
              🚀 Alpha Track Registry
            </Link>
          </div>
        )}
      </header>

      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded text-center">
        <p className="text-neutral-500 text-sm tracking-widest uppercase">
          Awaiting Pioneer Directives...
        </p>
      </div>
    </div>
  );
}