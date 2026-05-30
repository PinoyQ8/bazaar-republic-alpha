'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AcademyDashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  // 🛡️ MASTER TS VERIFICATION PIPELINE
  useEffect(() => {
    const masterToken = localStorage.getItem('MASTER_TS');

    if (!masterToken) {
      console.error("[MESH-FRACTURE] Access Denied: Unauthorized Node.");
      router.push('/log-in'); 
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  // 🛡️ PRE-FLIGHT RENDER BLOCK
  if (!isAuthorized) {
    return (
      <main className="max-w-[384px] mx-auto p-4 min-h-screen bg-zinc-950 flex items-center justify-center font-mono">
        <p className="text-emerald-500 text-xs animate-pulse tracking-widest uppercase">Verifying Master TS...</p>
      </main>
    );
  }

  return (
    <main className="max-w-[384px] mx-auto p-4 min-h-screen bg-zinc-950 text-zinc-100 font-mono selection:bg-emerald-500/30">
      
      {/* 🛡️ ACADEMY HEADER */}
      <div className="mb-6 border-b border-zinc-800 pb-4">
        <h1 className="text-emerald-400 font-bold tracking-widest uppercase text-sm">MESH ACADEMY</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">System Online</p>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Logic Forge Modules</h3>
        
        {/* 🛡️ DAO ARCHITECTURE CARD */}
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg mb-4 hover:border-zinc-700 transition-all">
          <h4 className="text-emerald-300 font-bold text-sm tracking-wider uppercase mb-1">DAO Architecture</h4>
          <p className="text-[10px] text-zinc-500 mb-4">Constitutional data & 5-Tier governance.</p>
          <Link href="/academy/dao-architecture" className="block w-full">
            <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-[10px] font-bold uppercase tracking-wider rounded transition-colors">
              Enter Matrix
            </button>
          </Link>
        </div>

        {/* 🛡️ ALPHA TRACK CARD */}
        <div className="p-4 bg-[#05140e] border border-emerald-500/30 rounded-lg shadow-[0_0_15px_rgba(0,210,138,0.05)]">
          <h4 className="text-emerald-400 font-bold text-sm tracking-wider uppercase mb-1">Alpha Track</h4>
          <p className="text-[10px] text-emerald-500/70 mb-4 leading-relaxed">Genesis Minting & Ledger Payloads.</p>
          <Link href="/alpha-track" className="block w-full">
            <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-[10px] font-bold uppercase tracking-wider rounded transition-colors">
              Access Alpha
            </button>
          </Link>
        </div>
      </div>

      {/* 🛡️ EXIT PROTOCOL */}
      <div className="mt-12">
        <Link href="/dashboard" className="block w-full">
          <button className="w-full py-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-600 text-[10px] font-bold uppercase tracking-wider rounded transition-all">
            Return to Hub
          </button>
        </Link>
      </div>
    </main>
  );
}