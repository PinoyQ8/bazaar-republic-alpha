"use client";

import React, { useEffect, useState, useCallback } from "react";

interface EscrowLock {
  id: string;
  escrowId: string;
  consumerUid: string;
  providerId: string;
  amount: number;
  token: string;
  status: string;
  originNode: string;
  settledByNode?: string;
  releaseTxHash?: string;
}

interface DisputeRecord {
  id: string;
  escrowId: string;
  status: string;
  initiatorUid: string;
  reason: string;
  votesForConsumer: number;
  votesForMerchant: number;
  selectedElders: string[];
  createdAt: string;
  escrowLock?: EscrowLock;
}

interface CouncilFeed {
  totalRecords: number;
  counts: {
    tier1Automated: number;
    tier2PendingQuorum: number;
    tier2ResolvedQuorum: number;
  };
  automatedResolutions: DisputeRecord[];
  pendingCouncilQuorum: DisputeRecord[];
  resolvedCouncilQuorum: DisputeRecord[];
}

export default function CouncilDashboard() {
  const [feed, setFeed] = useState<CouncilFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingOn, setVotingOn] = useState<string | null>(null);
  const [elderUid, setElderUid] = useState("usr_pioneer_elder_alpha");

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/council/decisions");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setFeed(data);
      } else {
        setError(data.error || "Failed to load decisions");
      }
    } catch (err: any) {
      console.error("[COUNCIL_FEED_ERR]:", err);
      setError(err?.message || "Connection to Node-001 lost");
    } finally {
      setLoading(false);
    }
  }, []);

  async function castVote(escrowId: string, vote: "CONSUMER" | "MERCHANT") {
    try {
      setVotingOn(escrowId);
      const res = await fetch("/api/council/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escrowId,
          elderUid,
          vote,
          justification: `Voted ${vote} via Council S23 Grid`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchFeed();
      } else {
        alert(`Vote Rejected: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Vote Failed: ${err.message}`);
    } finally {
      setVotingOn(null);
    }
  }

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const pending = feed?.pendingCouncilQuorum ?? [];
  const autoResolved = feed?.automatedResolutions ?? [];
  const quorumResolved = feed?.resolvedCouncilQuorum ?? [];

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 p-3 pb-20 font-sans">
      <div className="w-full max-w-[384px] mx-auto space-y-4">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-3 space-y-1">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Council Governance Grid
            </h1>
            <button
              onClick={() => fetchFeed()}
              disabled={loading}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] rounded text-slate-300 active:scale-95 transition"
            >
              {loading ? "..." : "Refresh"}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">MESH Protocol Dual-Tier Dispute Arbiter</p>
        </div>

        {/* Elder UID Selector */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded text-xs space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Active Node / Elder UID</label>
          <div className="flex gap-1.5">
            <button
              onClick={() => setElderUid("usr_pioneer_elder_alpha")}
              className={`flex-1 py-1 text-[11px] font-mono rounded border transition ${
                elderUid === "usr_pioneer_elder_alpha"
                  ? "bg-cyan-950 border-cyan-500 text-cyan-200"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`}
            >
              Elder Alpha
            </button>
            <button
              onClick={() => setElderUid("usr_pioneer_elder_beta")}
              className={`flex-1 py-1 text-[11px] font-mono rounded border transition ${
                elderUid === "usr_pioneer_elder_beta"
                  ? "bg-cyan-950 border-cyan-500 text-cyan-200"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`}
            >
              Elder Beta
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-950/80 border border-rose-800 p-2 rounded text-[11px] text-rose-300">
            {error}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-900/80 border border-slate-800 p-2 rounded text-center">
            <div className="text-[9px] text-slate-400 uppercase">Tier 1 Auto</div>
            <div className="text-base font-bold text-cyan-400 mt-0.5">{feed?.counts?.tier1Automated ?? 0}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-2 rounded text-center">
            <div className="text-[9px] text-slate-400 uppercase">Pending (N=2)</div>
            <div className="text-base font-bold text-amber-400 mt-0.5">{feed?.counts?.tier2PendingQuorum ?? 0}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-2 rounded text-center">
            <div className="text-[9px] text-slate-400 uppercase">Settled</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">{feed?.counts?.tier2ResolvedQuorum ?? 0}</div>
          </div>
        </div>

        {/* Section: Pending Quorum Queue */}
        <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2.5">
          <div className="text-xs font-semibold text-amber-400 flex items-center justify-between">
            <span>⚠️ TIER 2 ACTIVE QUORUM</span>
            <span className="text-[10px] text-slate-400 font-normal">{pending.length} in queue</span>
          </div>

          {loading && !feed ? (
            <div className="text-[11px] text-slate-500 text-center py-4">Syncing ledger feed...</div>
          ) : pending.length === 0 ? (
            <div className="text-[11px] text-slate-500 text-center py-3 border border-dashed border-slate-800/80 rounded">
              Quorum queue clear. No pending votes.
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map((item) => (
                <div key={item.id} className="bg-slate-950 border border-slate-800 p-2.5 rounded space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-[11px] font-bold text-cyan-300 truncate max-w-[200px]">
                        {item.escrowId}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.escrowLock?.amount ?? 0} {item.escrowLock?.token ?? "PI"}
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded">
                      {item.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 bg-slate-900/50 p-1.5 rounded">
                    {item.reason}
                  </div>

                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Votes: C:{item.votesForConsumer} / M:{item.votesForMerchant}</span>
                    <span>{item.selectedElders?.length ?? 0}/2 Quorum</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      disabled={votingOn === item.escrowId}
                      onClick={() => castVote(item.escrowId, "CONSUMER")}
                      className="py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 text-[10px] font-semibold rounded active:scale-95 transition"
                    >
                      Vote Refund
                    </button>
                    <button
                      disabled={votingOn === item.escrowId}
                      onClick={() => castVote(item.escrowId, "MERCHANT")}
                      className="py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-200 text-[10px] font-semibold rounded active:scale-95 transition"
                    >
                      Vote Release
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Settled Ledger */}
        <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2">
          <div className="text-xs font-semibold text-emerald-400">⚖️ SETTLED DISPUTES</div>
          {quorumResolved.length === 0 && autoResolved.length === 0 ? (
            <div className="text-[11px] text-slate-500 text-center py-2">No settled records.</div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {quorumResolved.map((item) => (
                <div key={item.id} className="bg-slate-950/80 border border-slate-800/80 p-2 rounded text-[11px] space-y-0.5">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-cyan-300 truncate max-w-[180px]">{item.escrowId}</span>
                    <span className="text-emerald-400">{item.status}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">
                    Tx: {item.escrowLock?.releaseTxHash || "On-Chain Settled"}
                  </div>
                </div>
              ))}
              {autoResolved.map((item) => (
                <div key={item.id} className="bg-slate-950/80 border border-slate-800/80 p-2 rounded text-[11px] space-y-0.5">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-cyan-300 truncate max-w-[180px]">{item.escrowId}</span>
                    <span className="text-cyan-400">TIER_1_AUTO</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">
                    Tx: {item.escrowLock?.releaseTxHash || "Checksum Match"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
