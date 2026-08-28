'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Layers, 
  Repeat, 
  ShieldCheck, 
  Cpu, 
  Smartphone, 
  Terminal, 
  Zap, 
  Lock, 
  Activity, 
  ArrowUpRight, 
  CheckCircle2,
  TrendingUp,
  Coins,
  Shield
} from 'lucide-react';

export default function MeshHubPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans pb-28">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* ========================================================================= */}
        {/* HERO / PROTOCOL STATUS HEADER                                            */}
        {/* ========================================================================= */}
        <div className="bg-linear-to-br from-neutral-900 via-neutral-900/90 to-cyan-950/30 border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
          {/* Subtle Glow Backdrop */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase flex items-center gap-1">
                  <Zap size={12} className="fill-cyan-400" /> MESH L2 ACTIVE
                </span>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase flex items-center gap-1">
                  <CheckCircle2 size={12} /> PiOS LICENSED
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Layer-2 Protocol Hub
              </h1>
              <p className="text-xs md:text-sm text-neutral-400 font-mono mt-1">
                Architected by <span className="text-amber-400 font-bold">PinoyQ8 - Founder & Co-Pioneer</span>
              </p>
            </div>

            {/* TELEMETRY QUICK BADGES */}
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <div className="bg-neutral-950/80 border border-neutral-800 px-3 py-2 rounded-xl flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" />
                <div>
                  <div className="text-[9px] text-neutral-500 uppercase">Shield Health</div>
                  <div className="font-bold text-emerald-400">92% Uptime</div>
                </div>
              </div>
              <div className="bg-neutral-950/80 border border-neutral-800 px-3 py-2 rounded-xl flex items-center gap-2">
                <Coins size={16} className="text-amber-400" />
                <div>
                  <div className="text-[9px] text-neutral-500 uppercase">Gas Buffer</div>
                  <div className="font-bold text-amber-400">50.0 PI Safe</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LIVE METRICS BAR                                                         */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-neutral-900/60 border border-neutral-800/80 p-3 rounded-xl space-y-1">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">AMM Invariant (k)</span>
            <span className="text-sm font-bold text-cyan-400 truncate block">100,000,000,000</span>
            <span className="text-[9px] text-neutral-400">PI / mBZR Constant Pool</span>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800/80 p-3 rounded-xl space-y-1">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Passkey Enclave</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
              <Lock size={12} /> secp256r1
            </span>
            <span className="text-[9px] text-neutral-400">Hardware WebAuthn</span>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800/80 p-3 rounded-xl space-y-1">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Timelock Window</span>
            <span className="text-sm font-bold text-indigo-400 block">48 Hours</span>
            <span className="text-[9px] text-neutral-400">Escrow Auto-Payout</span>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800/80 p-3 rounded-xl space-y-1">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">DePIN Stake Lock</span>
            <span className="text-sm font-bold text-amber-400 block">10,000 mBZR</span>
            <span className="text-[9px] text-neutral-400">Adjudicator Collateral</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CORE SECTOR NAVIGATION GRID                                              */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
            <Layers size={14} className="text-cyan-400" /> MESH Layer-2 Engine Sectors
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* SECTOR 1: AMM SWAP */}
            <Link 
              href="/mesh/swap" 
              className="group p-5 bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 rounded-2xl transition-all duration-200 space-y-3 relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-cyan-950/80 border border-cyan-800/80 rounded-xl text-cyan-400">
                  <Repeat size={20} />
                </div>
                <span className="text-xs font-mono text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Enter Sector <ArrowUpRight size={14} />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-100 group-hover:text-cyan-300 transition">
                    $mBZR AMM Swap Engine
                  </h3>
                  <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-900">
                    x * y = k
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Execute instant zero-gas micro-swaps between $PI and internal $mBZR token reserves powered by the Smart Order Router (SOR).
                </p>
              </div>
            </Link>

            {/* SECTOR 2: ESCROW ENGINE */}
            <Link 
              href="/mesh/escrow" 
              className="group p-5 bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 rounded-2xl transition-all duration-200 space-y-3 relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-indigo-950/80 border border-indigo-800/80 rounded-xl text-indigo-400">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-xs font-mono text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Enter Sector <ArrowUpRight size={14} />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-100 group-hover:text-indigo-300 transition">
                    E-Network Merchant Escrow
                  </h3>
                  <span className="text-[9px] font-mono bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-900">
                    Noir ZK
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Decentralized escrow vault for service providers featuring 48-hour timelock auto-release and biometric Passkey authorizations.
                </p>
              </div>
            </Link>

            {/* SECTOR 3: DePIN NODE OPERATOR */}
            <Link 
              href="/mesh/node" 
              className="group p-5 bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 rounded-2xl transition-all duration-200 space-y-3 relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-emerald-400">
                  <Cpu size={20} />
                </div>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Enter Sector <ArrowUpRight size={14} />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-100 group-hover:text-emerald-300 transition">
                    DePIN Node Operator Network
                  </h3>
                  <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900">
                    PoCS Yield
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Host off-chain ZK relayers, state channels, and A2U payment recovery workers to earn $mBZR service yields.
                </p>
              </div>
            </Link>

            {/* SECTOR 4: S23 TEST HARNESS */}
            <Link 
              href="/mesh/harness" 
              className="group p-5 bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-2xl transition-all duration-200 space-y-3 relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-amber-950/80 border border-amber-800/80 rounded-xl text-amber-400">
                  <Smartphone size={20} />
                </div>
                <span className="text-xs font-mono text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Enter Sector <ArrowUpRight size={14} />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-100 group-hover:text-amber-300 transition">
                    S23 Ultra Test Harness
                  </h3>
                  <span className="text-[9px] font-mono bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded border border-amber-900">
                    384x854 px
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Simulate Pi SDK v2.0 auth, Samsung Knox WebAuthn enclave enrollment, and mock error injection inside the mobile viewport.
                </p>
              </div>
            </Link>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* SYSTEM OPERATIONS BANNER                                                 */}
        {/* ========================================================================= */}
        <div className="bg-neutral-900/40 border border-green-900/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-950/80 border border-green-800 rounded-lg text-green-400 shrink-0">
              <Terminal size={20} />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-green-400 uppercase tracking-wider">
                MESH-SCAN Payout Uplink
              </div>
              <div className="text-xs text-neutral-400">
                Monitor real-time Stellar L1 blockchain settlements & A2U payment recovery logs.
              </div>
            </div>
          </div>

          <Link
            href="/mesh-scan"
            className="w-full sm:w-auto px-4 py-2 bg-green-950 hover:bg-green-900 text-green-400 border border-green-800 font-mono text-xs font-bold rounded-xl transition text-center shrink-0"
          >
            Launch MESH-SCAN
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* PROTOCOL FOOTER INFORMATION                                               */}
        {/* ========================================================================= */}
        <div className="text-center pt-4 border-t border-neutral-900 space-y-1">
          <p className="text-[11px] font-mono text-neutral-500">
            Project Bazaar • Built for Real Pioneers inside the Pi Network Ecosystem
          </p>
          <p className="text-[10px] font-mono text-neutral-600">
            Copyright (c) 2026 Bazaar Republic / PinoyQ8 - Founder & Co-Pioneer • Licensed under PiOS
          </p>
        </div>

      </div>
    </div>
  );
}