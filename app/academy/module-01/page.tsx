import React from "react";
import Link from "next/link";

export default function ModuleOnePage() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* 🚀 HEADER: SECTOR IDENTITY */}
      <header className="space-y-4">
        <div className="inline-block px-3 py-1 bg-blue-600/10 border border-blue-600/30 rounded text-[10px] text-blue-400 font-bold tracking-[0.3em] uppercase">
          Core Logic Module 01
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-white uppercase">
          The MESH Protocol
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm leading-relaxed italic">
          "A DAO without a hardened perimeter is just a public chatroom. 
          The MESH is the immune system of the Bazaar Republic, enforcing Logic Purity at the edge."
        </p>
      </header>

      {/* 🛡️ CORE TENETS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border border-slate-800 bg-slate-900/40 rounded-xl space-y-4">
          <div className="w-10 h-10 rounded bg-blue-900/30 border border-blue-500/50 flex items-center justify-center mb-4">
            <span className="text-blue-400 font-mono font-bold">01</span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Zero-Trust Architecture</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            The X570 Adjudicator assumes all inbound traffic is a rogue node until cryptographically proven otherwise via the Pi SDK handshakes.
          </p>
        </div>

        <div className="p-6 border border-slate-800 bg-slate-900/40 rounded-xl space-y-4">
          <div className="w-10 h-10 rounded bg-blue-900/30 border border-blue-500/50 flex items-center justify-center mb-4">
            <span className="text-blue-400 font-mono font-bold">02</span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">The Vault State Lock</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            Session tokens are strictly isolated in HttpOnly, SameSite(Lax) cookies. The client-side DOM is completely blind to the vault keys.
          </p>
        </div>
      </section>

      {/* 🛠️ TERMINAL SIMULATION: THE ADJUDICATOR IN ACTION */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Live Node Telemetry Simulation</h2>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[10px] sm:text-xs overflow-x-auto relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-600 to-transparent opacity-50"></div>
          <div className="space-y-2 text-slate-500">
            <p><span className="text-blue-500">Bazaar_Tech@X570:~$</span> init_mesh_scan --target=pioneer_auth</p>
            <p className="animate-pulse">[...] Awaiting Pi Network CDN Response</p>
            <p><span className="text-green-500">[OK]</span> AccessToken intercepted. Commencing Backend Verification.</p>
            <p><span className="text-green-500">[OK]</span> api.testnet.minepi.com/v2/me returned 200 OK.</p>
            <p><span className="text-blue-400">[INFO]</span> Forging HttpOnly Session Cookie...</p>
            <p><span className="text-green-500">[SECURE]</span> Perimeter Locked. Route /academy is now active.</p>
          </div>
        </div>
      </section>

      {/* 🚀 ACTION: ENTER NEXT MODULE */}
      <div className="pt-8 border-t border-slate-900 flex justify-between items-center">
        <Link href="/academy" className="text-slate-500 hover:text-slate-300 font-mono text-xs uppercase tracking-widest transition-colors">
          ← Back to Genesis
        </Link>
        <Link href="/academy/module-02" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold rounded shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all uppercase text-xs tracking-widest">
          Acknowledge & Proceed →
        </Link>
      </div>
    </div>
  );
}