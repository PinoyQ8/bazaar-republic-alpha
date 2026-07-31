'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Shield, Zap, CheckCircle2, Loader2, AlertTriangle, Database } from 'lucide-react';

interface LedgerEntry {
  id: string;
  consumerUid: string;
  providerId: string;
  units: number;
  totalCostMbzr: number;
  status: string;
  createdAt: string;
  provider?: {
    businessName: string;
    category: string;
  };
}

export default function LedgerHistoryPage() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/network/ledger');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch Mesh Ledger telemetry.');
      }
      setLedger(data.telemetry.ledger || []);
    } catch (err: any) {
      console.error('[LEDGER-SCAN] Exception:', err);
      setError(err.message || 'Error connecting to Mesh Ledger API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-6 min-h-screen bg-zinc-950 text-zinc-100 font-mono selection:bg-emerald-500/30 space-y-6">
      
      {/* 🛡️ MODULE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/network" className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-emerald-400 font-bold tracking-widest uppercase text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" /> MESH LEDGER TELEMETRY
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Real-Time Immutable Audit Trail for mBZR Settlements</p>
          </div>
        </div>

        <button
          onClick={fetchLedger}
          disabled={loading}
          className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 rounded transition-colors disabled:opacity-50"
          title="Sync Ledger"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* 🛡️ LEDGER LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-lg text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Querying Mesh Ledger Block Matrix...
          </div>
        ) : ledger.length === 0 ? (
          <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-lg text-center text-zinc-500 text-xs">
            No settlement records found in the current ledger epoch. Execute a micro-settlement to generate audit entries.
          </div>
        ) : (
          ledger.map((entry) => (
            <div key={entry.id} className="p-4 bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded uppercase">
                    {entry.status}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">ID: {entry.id.substring(0, 12)}...</span>
                </div>
                <h3 className="text-sm font-bold text-zinc-200">
                  {entry.provider?.businessName || 'E-Network Service Node'}
                </h3>
                <p className="text-[10px] text-zinc-500">
                  Consumer UID: <span className="text-zinc-400 font-mono">{entry.consumerUid}</span> • Units: {entry.units}
                </p>
                <p className="text-[10px] text-zinc-600">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-zinc-500 uppercase block">Settled Amount</span>
                <p className="text-sm font-bold text-purple-400">
                  -{entry.totalCostMbzr} <span className="text-[10px] text-zinc-400 font-normal">mBZR</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>

    </main>
  );
}