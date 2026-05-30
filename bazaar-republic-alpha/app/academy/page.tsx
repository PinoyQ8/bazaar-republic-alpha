// TARGET FILE PATH: [project-root]/app/academy/page.tsx
'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Correct App Router engine

export default function AcademyDashboard() {
  // 1. INSTANTIATE THE ROUTER ENGINE
  const router = useRouter();
  
  // 2. AUTHORIZATION STATE LOCK
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  // 3. MASTER TS VERIFICATION PIPELINE
  useEffect(() => {
    // Check the local workstation RAM for the Master Token
    const masterToken = localStorage.getItem('MASTER_TS');

    if (!masterToken) {
      console.error("[MESH-FRACTURE] No Master Token Found. Access Denied.");
      // Trigger the L1 fallback route
      router.push('/log-in'); 
    } else {
      console.log("[MESH-SYNC] Master Token Verified. Granting Access.");
      setIsAuthorized(true);
    }
  }, [router]);

  // TARGET: [project-root]/app/academy/page.tsx
// Replace everything from Step 4 downward.

  // 4. PRE-FLIGHT RENDER BLOCK (Shields data during redirect)
  if (!isAuthorized) {
    return (
      <main className="max-w-[384px] mx-auto p-4 min-h-screen bg-zinc-950 flex items-center justify-center font-mono">
        <p className="text-emerald-500 text-sm animate-pulse tracking-widest uppercase">Verifying Master TS...</p>
      </main>
    );
  }

  // 5. SECURE VIEWPORT RENDER (Locked for S23 Ultra)
  return (
    <main className="max-w-[384px] mx-auto p-4 min-h-screen bg-zinc-950 text-zinc-100 font-mono selection:bg-emerald-500/30">
      
      {/* 🛡️ ACADEMY HEADER */}
      <div className="mb-6 border-b border-zinc-800 pb-4">
        <h2 className="text-emerald-400 font-bold tracking-widest uppercase text-sm">MESH ACADEMY</h2>
        <p className="text-zinc-500 text-xs mt-1">Over-Mint Shield: <span className="text-emerald-500 font-bold">SECURED</span></p>
        <p className="text-zinc-500 text-xs mt-1">Clearance: <span className="text-emerald-300 font-bold">PIONEER VANGUARD</span></p>
      </div>
      
      <div className="mt-6">
        {/* 🛡️ LOGIC FORGE GREETING */}
        <h3 className="text-xs text-zinc-400 uppercase tracking-widest mb-2">THE LOGIC FORGE</h3>
        <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
          Welcome to the Academy. The E-Network data streams are active.
        </p>
        
        {/* 🛡️ ACTIVE MODULE CARD */}
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg mb-6">
          <h4 className="text-emerald-300 font-bold text-sm tracking-wider uppercase mb-1">Active Module: DAO Architecture</h4>
          <p className="text-xs text-zinc-500 mb-4">Status: <span className="text-emerald-400">Synchronized</span></p>
          
          {/* 🛡️ THE BRIDGE: Wrapped button in Next.js Link router */}
          <Link href="/academy/dao-architecture" className="block w-full outline-none">
            {/* 🛡️ AESTHETIC FIX: Swapped zinc-800 for emerald-600 */}
            <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-sm font-bold uppercase tracking-wider rounded transition-colors">
              Enter Matrix
            </button>
          </Link>
        </div>

        {/* 🛡️ ALPHA TRACK BRIDGE */}
        <div className="p-4 bg-[#05140e] border border-emerald-500/50 rounded-lg mt-6 shadow-[0_0_15px_rgba(0,210,138,0.05)]">
          <h4 className="text-emerald-400 font-bold text-sm tracking-wider uppercase mb-2">The Logic Forge: Alpha Track</h4>
          <p className="text-xs text-emerald-500/70 mb-4 leading-relaxed">Execute Genesis Mint and Redemption Payloads.</p>
          <Link href="/alpha-track" className="block w-full outline-none">
            <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-sm font-bold uppercase tracking-wider rounded transition-colors">
              ACCESS ALPHA TRACK
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}