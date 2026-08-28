'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Shield, 
  Users, 
  RefreshCw, 
  Database, 
  ArrowLeft, 
  AlertTriangle, 
  Slash, 
  Loader2, 
  CheckCircle2, 
  ShieldAlert 
} from 'lucide-react';

interface PioneerNodeData {
  id: string;
  uid: string;
  status: string;
  tier: string;
  stakedPi: number;
  mbzrBalance: number;
  trustScore?: number;
  updatedAt: string;
}

interface LedgerData {
  id: string;
  pioneerUid?: string;
  walletId?: string;
  txType: string;
  piAmount: number;
  mbzrAmount: number;
  status: string;
  createdAt?: string;
  timestamp?: string;
}

export default function MeshScanAdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slashingUid, setSlashingUid] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [telemetry, setTelemetry] = useState<{
    totalNodes: number;
    totalStakedPi: number;
    totalMbzrBalance: number;
    nodes: PioneerNodeData[];
    ledger: LedgerData[];
  } | null>(null);

  const fetchTelemetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/mesh-scan');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Telemetry sync failed.');
      setTelemetry(data.telemetry);
    } catch (err: any) {
      console.error('[MESH-SCAN] Audit Fault:', err);
      setError(err.message || 'Critical failure querying MongoDB.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  // 🛡️ ADMIN ACTION: Quarantine & Slash Node
  const handleSlashNode = async (nodeUid: string, currentStakedPi: number, currentMbzr: number) => {
    const confirmSlash = window.confirm(
      `[SECURITY ADJUDICATOR WARNING]\n\nAre you sure you want to QUARANTINE & SLASH Node [${nodeUid}]?\n\n- Node status will set to FROZEN\n- ${currentStakedPi} Pi collateral slashed (70% to active Guardians, 30% to DAO Treasury)\n- ${currentMbzr} mBZR balance burned\n\nThis action is irreversible.`
    );

    if (!confirmSlash) return;

    setSlashingUid(nodeUid);
    setActionFeedback(null);

    try {
      const response = await fetch('/api/admin/slash-distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetNodeUid: nodeUid,
          reason: 'ADMIN_PCT_BLACKLIST_TRIGGER',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Slashing pipeline execution failed.');
      }

      setActionFeedback({
        type: 'success',
        msg: `Node [${nodeUid}] QUARANTINED. ${result.telemetry.slashedPiTotal} Pi slashed. ${result.telemetry.activeGuardiansRewardedCount} active Guardians credited.`,
      });

      // Refresh real-time node fleet & ledger state
      await fetchTelemetry();
    } catch (err: any) {
      console.error('[MESH-SECURITY] Slashing Exception:', err);
      setActionFeedback({
        type: 'error',
        msg: err.message || 'Failed to complete node slash event.',
      });
    } finally {
      setSlashingUid(null);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-6 min-h-screen bg-zinc-950 text-zinc-100 font-mono selection:bg-emerald-500/30 space-y-6">
      
      {/* 🛡️ ADMIN HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/academy" className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-emerald-400 font-bold tracking-widest uppercase text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> MESH-SCAN ADMIN TELEMETRY
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Live Database Audit & Security Adjudicator Gateway</p>
          </div>
        </div>
        <button
          onClick={fetchTelemetry}
          disabled={loading}
          className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 text-xs font-bold uppercase rounded flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Sync Ledger
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {actionFeedback && (
        <div className={`p-3 border rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-300 ${
          actionFeedback.type === 'success' 
            ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' 
            : 'bg-red-950/30 border-red-900/50 text-red-400'
        }`}>
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{actionFeedback.msg}</span>
        </div>
      )}

      {/* 🛡️ AGGREGATE NETWORK METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <Users className="w-3 h-3 text-cyan-400" /> Total Nodes Registered
          </span>
          <p className="text-xl font-bold text-cyan-400">{loading ? '...' : telemetry?.totalNodes || 0}</p>
        </div>

        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" /> Total Staked Pi (Vault)
          </span>
          <p className="text-xl font-bold text-emerald-400">{loading ? '...' : `${(telemetry?.totalStakedPi || 0).toFixed(2)} Pi`}</p>
        </div>

        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <Database className="w-3 h-3 text-purple-400" /> Circulating mBZR
          </span>
          <p className="text-xl font-bold text-purple-400">{loading ? '...' : `${(telemetry?.totalMbzrBalance || 0).toFixed(2)} mBZR`}</p>
        </div>

      </div>

      {/* 🛡️ PIONEER NODE FLEET TABLE WITH QUARANTINE ACTION */}
      <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
            Pioneer Node Fleet ({telemetry?.nodes.length || 0})
          </h3>
          <span className="text-[9px] text-zinc-500 uppercase">Security Actions Enabled</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase">
                <th className="pb-2">Node UID</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Tier</th>
                <th className="pb-2">Staked Pi</th>
                <th className="pb-2">mBZR Balance</th>
                <th className="pb-2 text-right">Security Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
              {loading ? (
                <tr><td colSpan={6} className="py-4 text-center text-zinc-500">Scanning MongoDB nodes...</td></tr>
              ) : telemetry?.nodes.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-center text-zinc-500">No nodes registered in the ledger.</td></tr>
              ) : (
                telemetry?.nodes.map((node) => {
                  const isFrozen = node.status === 'FROZEN';
                  const isSlashingThis = slashingUid === node.uid;

                  return (
                    <tr key={node.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 font-mono text-cyan-400 truncate max-w-30">{node.uid}</td>
                      <td className="py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isFrozen 
                            ? 'bg-red-950 text-red-400 border border-red-900' 
                            : node.status === 'ACTIVE' 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' 
                              : 'bg-amber-950 text-amber-400 border border-amber-900'
                        }`}>
                          {node.status}
                        </span>
                      </td>
                      <td className="py-3 text-emerald-300">{node.tier}</td>
                      <td className="py-3 text-blue-400">{node.stakedPi} Pi</td>
                      <td className="py-3 text-purple-400">{node.mbzrBalance} mBZR</td>
                      <td className="py-3 text-right">
                        {isFrozen ? (
                          <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider">
                            QUARANTINED
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSlashNode(node.uid, node.stakedPi, node.mbzrBalance)}
                            disabled={isSlashingThis || (node.stakedPi === 0 && node.mbzrBalance === 0)}
                            className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/80 border border-red-900/60 text-red-400 hover:text-red-200 text-[9px] font-bold uppercase rounded transition-colors flex items-center gap-1 ml-auto disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isSlashingThis ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> SLASHING...</>
                            ) : (
                              <><Slash className="w-3 h-3" /> QUARANTINE & SLASH</>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🛡️ IMMUTABLE LEDGER AUDIT FEED */}
      <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg space-y-4">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-800 pb-2">
          Immutable Ledger Audit Feed
        </h3>
        
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-zinc-500 text-center py-4">Pulling ledger blocks...</p>
          ) : telemetry?.ledger.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">No transactions recorded yet.</p>
          ) : (
            telemetry?.ledger.map((tx) => {
              const txUser = tx.pioneerUid || tx.walletId || 'UNKNOWN_NODE';
              const isSlashTx = tx.txType === 'SLASH_EXECUTED' || tx.txType === 'SLASH_YIELD_REWARD' || tx.txType === 'DAO_TREASURY_SWEEP';

              return (
                <div key={tx.id} className="p-3 bg-zinc-950 border border-zinc-800/80 rounded flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[9px] font-bold ${
                      tx.txType === 'GENESIS_MINT' 
                        ? 'bg-emerald-950 text-emerald-400' 
                        : tx.txType === 'SLASH_EXECUTED' 
                          ? 'bg-red-950 text-red-400 border border-red-900'
                          : tx.txType === 'SLASH_YIELD_REWARD'
                            ? 'bg-cyan-950 text-cyan-400'
                            : tx.txType === 'DAO_TREASURY_SWEEP'
                              ? 'bg-purple-950 text-purple-400'
                              : 'bg-amber-950 text-amber-400'
                    }`}>
                      {tx.txType}
                    </span>
                    <div>
                      <p className="text-zinc-300 font-mono text-[11px] truncate max-w-45 md:max-w-xs">{txUser}</p>
                      <p className="text-[9px] text-zinc-500">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString() : tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : 'CONFIRMED'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isSlashTx ? 'text-amber-400' : 'text-emerald-400'}`}>{tx.piAmount} Pi</p>
                    <p className="text-[10px] text-zinc-400">{tx.mbzrAmount} mBZR</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </main>
  );
}