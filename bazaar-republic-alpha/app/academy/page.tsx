'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Loader2, AlertTriangle, ShieldCheck, Lock, Unlock } from 'lucide-react';

export default function AcademyDashboard() {
  const { pioneer, login } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🛡️ GATE LOGIC: Are they fully active on Schema v2.3?
  const isActive = pioneer.status === 'ACTIVE' || pioneer.status === 'FROZEN' || pioneer.status === 'SUSPENDED';

  // 🛡️ GENESIS UPGRADE PIPELINE
  const handleGenesisUpgrade = async () => {
    if (!pioneer.uid) {
      setError('MESH_ERROR: Node Identity Missing. Reboot session.');
      return;
    }

    setIsUpgrading(true);
    setError(null);

    try {
      const res = await fetch('/api/academy/genesis-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: pioneer.uid }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Ledger synchronization failed.');

      // Sync Global Context & Cache
      login({ status: data.status, tier: data.tier });
      
      const cachedUser = JSON.parse(localStorage.getItem('pi_auth_user') || '{}');
      localStorage.setItem('pi_auth_user', JSON.stringify({ ...cachedUser, status: data.status, tier: data.tier }));
      localStorage.setItem('mesh_pioneer_status', data.status);
      localStorage.setItem('mesh_pioneer_tier', data.tier);

    } catch (err: any) {
      console.error('[MESH-SCAN] Upgrade Fault:', err);
      setError(err.message || 'Critical fault during upgrade sequence.');
    } finally {
      setIsUpgrading(false);
    }
  };

  // 🛡️ PRE-FLIGHT RENDER BLOCK
  if (!pioneer.isHydrated) {
    return (
      <main className="max-w-[384px] mx-auto p-4 min-h-screen bg-zinc-950 flex items-center justify-center font-mono">
        <p className="text-emerald-500 text-xs animate-pulse tracking-widest uppercase">Verifying Master TS...</p>
      </main>
    );
  }

  return (
    <main className="max-w-[384px] mx-auto p-4 pb-24 min-h-screen bg-zinc-950 text-zinc-100 font-mono selection:bg-emerald-500/30">
      
      {/* 🛡️ ACADEMY HEADER */}
      <div className="mb-6 border-b border-zinc-800 pb-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-emerald-400 font-bold tracking-widest uppercase text-sm">MESH ACADEMY</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">System Online</p>
            </div>
          </div>
          <div className="text-right flex flex-col gap-1">
            <span className="text-[10px] text-zinc-500 tracking-widest">NODE STATUS</span>
            <span className={`text-xs font-bold ${isActive ? 'text-emerald-500' : 'text-amber-500'}`}>
              [{pioneer.status}]
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 space-y-4">
        
        {/* 🛡️ MODULE 01: GENESIS GATE (Mandatory) */}
        <div className={`p-4 border rounded-lg transition-all ${isActive ? 'bg-zinc-900/30 border-emerald-900/30' : 'bg-[#05140e] border-emerald-500/50 shadow-[0_0_15px_rgba(0,210,138,0.1)]'}`}>
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-emerald-400 font-bold text-sm tracking-wider uppercase">01. Genesis Protocol</h4>
            {isActive ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
          </div>
          
          <p className="text-[10px] text-emerald-500/70 mb-4 leading-relaxed">
            {isActive ? "Identity anchored to the MESH Ledger." : "Acknowledge the Republic Mandate to activate your node."}
          </p>

          {error && <p className="text-[10px] text-red-400 mb-2">{error}</p>}

          {!isActive ? (
            <button 
              onClick={handleGenesisUpgrade}
              disabled={isUpgrading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex justify-center items-center gap-2"
            >
              {isUpgrading ? <><Loader2 className="w-3 h-3 animate-spin" /> SYNCHRONIZING...</> : "ACKNOWLEDGE & UPGRADE"}
            </button>
          ) : (
            <div className="w-full py-2 bg-emerald-950/30 text-emerald-500 border border-emerald-900/50 text-center text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2">
               GENESIS COMPLETED
            </div>
          )}
        </div>

        {/* 🛡️ MODULE 02: DAO ARCHITECTURE (Locked until ACTIVE) */}
        <div className={`p-4 border rounded-lg transition-all ${isActive ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' : 'bg-zinc-950 border-zinc-900 opacity-50 cursor-not-allowed'}`}>
          <div className="flex justify-between items-start mb-2">
            <h4 className={`${isActive ? 'text-emerald-300' : 'text-zinc-600'} font-bold text-sm tracking-wider uppercase`}>02. DAO Architecture</h4>
            {isActive ? <Unlock className="w-4 h-4 text-zinc-500" /> : <Lock className="w-4 h-4 text-zinc-700" />}
          </div>
          <p className="text-[10px] text-zinc-500 mb-4">Constitutional data & 5-Tier governance.</p>
          
          {isActive ? (
            <Link href="/academy/dao-architecture" className="block w-full">
              <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-[10px] font-bold uppercase tracking-wider rounded transition-colors">
                Enter Matrix
              </button>
            </Link>
          ) : (
            <button disabled className="w-full py-2 bg-zinc-900 text-zinc-700 text-[10px] font-bold uppercase tracking-wider rounded">
              LOCKED
            </button>
          )}
        </div>

        {/* 🛡️ MODULE 03: ALPHA TRACK (Locked until ACTIVE) */}
        <div className={`p-4 border rounded-lg transition-all ${isActive ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' : 'bg-zinc-950 border-zinc-900 opacity-50 cursor-not-allowed'}`}>
          <div className="flex justify-between items-start mb-2">
            <h4 className={`${isActive ? 'text-emerald-300' : 'text-zinc-600'} font-bold text-sm tracking-wider uppercase`}>03. Alpha Track</h4>
            {isActive ? <Unlock className="w-4 h-4 text-zinc-500" /> : <Lock className="w-4 h-4 text-zinc-700" />}
          </div>
          <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">Genesis Minting & Ledger Payloads.</p>
          
          {isActive ? (
            <Link href="/alpha-track" className="block w-full">
              <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-[10px] font-bold uppercase tracking-wider rounded transition-colors">
                Access Alpha
              </button>
            </Link>
          ) : (
            <button disabled className="w-full py-2 bg-zinc-900 text-zinc-700 text-[10px] font-bold uppercase tracking-wider rounded">
              LOCKED
            </button>
          )}
        </div>

      </div>
    </main>
  );
}