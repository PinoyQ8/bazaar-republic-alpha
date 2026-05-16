import React from "react";
import Link from "next/link";

export default function ModuleOnePage() {
  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-700 selection:bg-green-500 selection:text-black">
      
      {/* 🚀 HEADER: SECTOR IDENTITY */}
      <header className="border-b border-green-900/60 pb-3 pt-1 space-y-1.5">
        <div className="inline-block px-2 py-0.5 bg-green-950/40 border border-green-700/40 rounded-sm text-[9px] text-green-400 font-bold tracking-[0.2em] uppercase">
          Core Logic Module 01
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
          The MESH Protocol
        </h1>
        <p className="text-green-400/80 text-[11px] leading-relaxed italic">
          "A DAO without a hardened perimeter is just a public chatroom. 
          The MESH is the immune system of the Bazaar Republic."
        </p>
      </header>

      {/* 🛡️ CORE TENETS (Stacked smoothly for mobile tracking) */}
      <section className="space-y-3 my-3">
        {/* TENET 01 */}
        <div className="p-3 border border-green-900/50 bg-green-950/10 rounded-sm space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="px-1.5 py-0.5 rounded-sm bg-green-900/20 border border-green-600/40 text-[10px] font-bold text-white">
              01
            </div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Zero-Trust Architecture
            </h3>
          </div>
          <p className="text-[11px] text-green-400/90 leading-normal">
            The X570 Adjudicator assumes all inbound traffic is a rogue node until verified via Pi SDK handshakes.
          </p>
        </div>

        {/* TENET 02 */}
        <div className="p-3 border border-green-900/50 bg-green-950/10 rounded-sm space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="px-1.5 py-0.5 rounded-sm bg-green-900/20 border border-green-600/40 text-[10px] font-bold text-white">
              02
            </div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              The Vault State Lock
            </h3>
          </div>
          <p className="text-[11px] text-green-400/90 leading-normal">
            Session tokens are strictly isolated in HttpOnly cookies. The client DOM remains completely blind to vault keys.
          </p>
        </div>
      </section>

      {/* 🛠️ TERMINAL SIMULATION: THE ADJUDICATOR IN ACTION */}
      <section className="space-y-1.5">
        <h2 className="text-[10px] font-bold text-green-600 uppercase tracking-widest">// Live Node Telemetry Simulation</h2>
        <div className="p-3 bg-black border border-green-900 rounded-sm text-[10px] overflow-x-auto relative">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-green-500 to-transparent opacity-40"></div>
          <div className="space-y-1 text-green-500/70">
            <p><span className="text-white">Bazaar_Tech@X570:~$</span> init_mesh_scan --target=pioneer_auth</p>
            <p className="animate-pulse text-yellow-600">[...] Awaiting Pi Network CDN Response</p>
            <p><span className="text-emerald-400">[OK]</span> AccessToken intercepted. Commencing Verification.</p>
            <p><span className="text-emerald-400">[OK]</span> api.testnet.minepi.com/v2/me returned 200 OK.</p>
            <p><span className="text-cyan-400">[INFO]</span> Forging HttpOnly Session Cookie...</p>
            <p><span className="text-emerald-400">[SECURE]</span> Perimeter Locked. Route /academy is active.</p>
          </div>
        </div>
      </section>

      {/* 🚀 ACTION: ENTER NEXT MODULE */}
      <footer className="pt-3 mt-3 border-t border-green-900/60 flex justify-between items-center">
        <Link href="/academy" className="text-green-700 hover:text-green-400 text-[10px] uppercase tracking-wider transition-colors">
          ← Back
        </Link>
        <Link href="/academy/module-02" className="px-4 py-2 bg-green-900 text-black font-bold rounded-sm hover:bg-green-500 transition-all uppercase text-[10px] tracking-wider shadow-[0_0_15px_rgba(34,197,94,0.1)]">
          Acknowledge & Proceed →
        </Link>
      </footer>
    </div>
  );
}