'use client';

import React, { useState, useEffect } from 'react';

interface AuditData {
  balance: number;
  thresholds: {
    low_threshold: number;
    med_threshold: number;
    high_threshold: number;
  };
  signers: Array<{ key: string; weight: number }>;
  isArmed: boolean;
  isMasterRevoked: boolean;
}

interface TelemetryData {
  syncState: {
    totalPiEvacuated: number;
    lastLedger: number;
    activeShields: number;
    syncedAt?: string;
  };
  quarantinedNodes: Array<{
    uid: string;
    username: string | null;
    walletAddress: string | null;
    status: string;
    vaultAddress: string | null;
    isElderEligible: boolean;
    isContributorUnlocked: boolean;
  }>;
  recentSweeps: Array<{
    id: string;
    piAmount: number;
    txHash: string | null;
    status: string;
    createdAt: string;
  }>;
}

export default function GuardianMeshPage() {
  // Manual Execution State
  const [compromisedSecret, setCompromisedSecret] = useState('');
  const [guardianSecret, setGuardianSecret] = useState('');
  const [vaultPublic, setVaultPublic] = useState('GB2OSGJYMSUVSRECWDBVEP3F5HQEW2OXFTHPEXRQP2DMBKKVLALSSSRV');
  const [revokeMaster, setRevokeMaster] = useState(true);

  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Live Telemetry State
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/mesh/guardian');
      const json = await res.json();
      if (json.success) {
        setTelemetry(json.data);
      }
    } catch (err) {
      console.error('Failed to poll telemetry:', err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleAudit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'AUDIT',
          compromisedSecret,
          guardianSecret,
          vaultPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');
      setAudit(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRecovery = async () => {
    setError(null);
    setLoading(true);
    setLogs([]);
    try {
      const res = await fetch('/api/guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXECUTE',
          compromisedSecret,
          guardianSecret,
          vaultPublic,
          revokeMaster,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = data.details ? ` (${JSON.stringify(data.details)})` : '';
        throw new Error((data.error || 'Execution failed') + details);
      }
      setLogs(data.logs || []);
      await handleAudit();
      await fetchTelemetry();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Status Indicator */}
        <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🛡️</span>
            <div>
              <h1 className="text-xl font-bold text-slate-100">RFC-002: Autonomous Guardian Mesh</h1>
              <p className="text-xs text-slate-400">Autonomous Sweeper Neutralization, L2 Node Quarantine & Cold Vault Routing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              Relayer Synchronized
            </span>
          </div>
        </div>

        {/* Global Telemetry Metrics */}
        {telemetry && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <span className="text-xs text-slate-400 block mb-1">Total Evacuated</span>
              <span className="text-xl font-bold text-emerald-400">
                {telemetry.syncState.totalPiEvacuated.toFixed(4)} Pi
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Cold storage balance</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <span className="text-xs text-slate-400 block mb-1">Active Shields</span>
              <span className="text-xl font-bold text-sky-400">
                {telemetry.syncState.activeShields}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Neutralized L1 seeds</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <span className="text-xs text-slate-400 block mb-1">Quarantined Nodes</span>
              <span className="text-xl font-bold text-amber-400">
                {telemetry.quarantinedNodes.length}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Governance stripped</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <span className="text-xs text-slate-400 block mb-1">Relayer Height</span>
              <span className="text-xl font-bold text-purple-400">
                {telemetry.syncState.lastLedger || '26785388'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Pi Testnet consensus</span>
            </div>
          </div>
        )}

        {/* Quarantined Pioneer Nodes & Escrows */}
        {telemetry && telemetry.quarantinedNodes.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Quarantined L2 Identities & Rerouted Escrow Contracts
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2">Node UID / Handle</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Compromised Key</th>
                    <th className="pb-2">Vault Destination</th>
                    <th className="pb-2">Privileges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {telemetry.quarantinedNodes.map((node) => (
                    <tr key={node.uid} className="hover:bg-slate-950/40">
                      <td className="py-2.5">
                        <div className="text-slate-200 font-bold">{node.uid}</div>
                        <div className="text-[10px] text-slate-500">{node.username || 'unnamed'}</div>
                      </td>
                      <td className="py-2.5">
                        <span className="bg-rose-950 border border-rose-800 text-rose-300 px-2 py-0.5 rounded text-[10px]">
                          {node.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400">
                        {node.walletAddress ? `${node.walletAddress.slice(0, 8)}...${node.walletAddress.slice(-6)}` : 'N/A'}
                      </td>
                      <td className="py-2.5 text-emerald-400 font-semibold">
                        {node.vaultAddress ? `${node.vaultAddress.slice(0, 8)}...${node.vaultAddress.slice(-6)}` : 'None'}
                      </td>
                      <td className="py-2.5 text-rose-400 text-[10px]">
                        Elder: {node.isElderEligible ? 'YES' : 'REVOKED'} | Contrib: {node.isContributorUnlocked ? 'YES' : 'REVOKED'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Input Configuration & Manual Action Terminal */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Compromised Seed Arming & Master Revocation Terminal
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Compromised Secret Key (Signer)</label>
              <input
                type="password"
                value={compromisedSecret}
                onChange={(e) => setCompromisedSecret(e.target.value)}
                placeholder="SCJQSK..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Guardian Secondary Signer Secret</label>
              <input
                type="password"
                value={guardianSecret}
                onChange={(e) => setGuardianSecret(e.target.value)}
                placeholder="SCGSSX..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Cold Recovery Vault Public Key</label>
              <input
                type="text"
                value={vaultPublic}
                onChange={(e) => setVaultPublic(e.target.value)}
                placeholder="GB2OSG..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-1 flex items-center space-x-2">
            <input
              type="checkbox"
              id="revokeMaster"
              checked={revokeMaster}
              onChange={(e) => setRevokeMaster(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-rose-600 focus:ring-0"
            />
            <label htmlFor="revokeMaster" className="text-xs text-rose-400 font-medium">
              Neutralize Master Key Permanently (Set masterWeight: 0, Guardian Weight: 1)
            </label>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={handleAudit}
              disabled={loading || !compromisedSecret}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-4 rounded text-xs font-semibold transition disabled:opacity-50"
            >
              Run Telemetry Audit
            </button>
            <button
              onClick={handleExecuteRecovery}
              disabled={loading || !compromisedSecret || !guardianSecret || !vaultPublic}
              className="flex-1 bg-rose-900 hover:bg-rose-800 text-rose-100 py-2 px-4 rounded text-xs font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Engage Shield & Neutralize Master'}
            </button>
          </div>
        </div>

        {/* Audit Status Display */}
        {audit && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Target Account On-Chain State</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-xs text-slate-400 block">Balance</span>
                <span className="text-base font-bold text-slate-100">{audit.balance} Pi</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-xs text-slate-400 block">Shield Status</span>
                <span className={`text-base font-bold ${audit.isArmed ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {audit.isArmed ? 'ARMED (2-of-2)' : 'UNARMED'}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-xs text-slate-400 block">Thresholds</span>
                <span className="text-sm font-bold text-slate-200">
                  {audit.thresholds.low_threshold}/{audit.thresholds.med_threshold}/{audit.thresholds.high_threshold}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-xs text-slate-400 block">Master Key State</span>
                <span className={`text-base font-bold ${audit.isMasterRevoked ? 'text-rose-400' : 'text-slate-200'}`}>
                  {audit.isMasterRevoked ? 'REVOKED (0)' : 'ACTIVE (1)'}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <span className="text-xs text-slate-400 block mb-2">Registered On-Chain Signers</span>
              <div className="space-y-1">
                {audit.signers.map((s, idx) => (
                  <div key={idx} className="text-xs bg-slate-950 p-2 rounded flex justify-between border border-slate-800/80">
                    <span className="text-slate-300 truncate max-w-sm">{s.key}</span>
                    <span className="text-slate-400 font-bold">Weight: {s.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Execution Log Console */}
        {(logs.length > 0 || error) && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-2">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Settlement Stream</h2>
            <div className="bg-slate-950 rounded p-4 font-mono text-xs space-y-1 max-h-60 overflow-y-auto border border-slate-800">
              {logs.map((log, index) => (
                <div key={index} className="text-slate-300">{log}</div>
              ))}
              {error && <div className="text-rose-400 font-semibold mt-2">Error: {error}</div>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}