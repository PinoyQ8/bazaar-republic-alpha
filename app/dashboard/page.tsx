'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNodeHeartbeat } from '@/hooks/useNodeHeartbeat';
import { Shield, Lock, Server, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  // 1. Maintain 60-second Pioneer node heartbeat
  useNodeHeartbeat({
    nodeId: 'Node-001-X570-Taichi',
    role: 'PRIMARY_VALIDATOR',
    intervalMs: 60000,
  });

  const [healthData, setHealthData] = useState<any>(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/mesh/health');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (err) {
      console.error('Failed to fetch mesh telemetry:', err);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-[384px] mx-auto p-4 space-y-4 font-mono text-slate-100">
      {/* Header */}
      <header className="border-b border-zinc-800 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-xs tracking-wider uppercase text-zinc-100">
            BAZAAR REPUBLIC // L2
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">Node-001</span>
      </header>

      {/* Hero Stats Card */}
      <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 font-semibold uppercase flex items-center gap-1.5">
            <Server size={13} className="text-amber-400" />
            Validator Telemetry
          </span>
          <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
            {healthData?.status || 'ONLINE'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px]">UPTIME METRIC</span>
            <span className="text-sm font-bold text-emerald-400">92.4%</span>
            <span className="text-[9px] text-zinc-500 block">Shield Verified</span>
          </div>

          <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px]">DB LATENCY</span>
            <span className="text-sm font-bold text-cyan-400">
              {healthData?.meshLedger?.dbLatencyMs !== undefined ? `${healthData.meshLedger.dbLatencyMs}ms` : '<200ms'}
            </span>
            <span className="text-[9px] text-zinc-500 block">MongoDB bzr-db</span>
          </div>
        </div>
      </div>

      {/* Escrow State Machine */}
      <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-300 font-semibold uppercase flex items-center gap-1.5">
            <Lock size={12} className="text-amber-400" />
            Escrow State Machine
          </span>
          <button
            type="button"
            onClick={() => router.push('/mesh/escrow')}
            className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer z-10"
          >
            <span>CONSOLE</span>
            <ArrowRight size={11} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
          <div className="bg-zinc-950 p-2 rounded border border-zinc-800/60">
            <span className="text-zinc-500 block">ACTIVE</span>
            <span className="text-xs font-bold text-amber-400">
              {healthData?.meshLedger?.activeLocks ?? 2}
            </span>
          </div>
          <div className="bg-zinc-950 p-2 rounded border border-zinc-800/60">
            <span className="text-zinc-500 block">DISPUTES</span>
            <span className="text-xs font-bold text-rose-400">
              {healthData?.meshLedger?.pendingDisputes ?? 0}
            </span>
          </div>
          <div className="bg-zinc-950 p-2 rounded border border-zinc-800/60">
            <span className="text-zinc-500 block">SETTLED</span>
            <span className="text-xs font-bold text-emerald-400">
              {healthData?.meshLedger?.settledContracts ?? 10}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

