"use client";

import { useEffect, useState } from "react";
import { Shield, Users, CheckCircle, XCircle, Activity, Loader2, AlertTriangle } from "lucide-react";

// 🛡️ NEO PROTOCOL: API Payload Types
interface TierData {
  id: string;
  name: string;
  tier: number;
  quorumReq: number;
  participation: number;
  approvalReq: number;
  approval: number;
  votesCast: number;
  votesTotal: number;
  passed: boolean;
}

interface ConsensusPayload {
  networkStatus: string;
  globalEdgeReached: boolean;
  tiersPassed: number;
  tiersRequired: number;
  matrix: TierData[];
}

export default function GovernanceDashboard() {
  // 📡 STATE MANAGEMENT: The Thin Client
  const [data, setData] = useState<ConsensusPayload | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 🛡️ API BRIDGE INITIATION
  useEffect(() => {
    const fetchConsensus = async () => {
      try {
        const response = await fetch("/api/governance/consensus");
        if (!response.ok) throw new Error("Adjudicator Intercept: Network Shield Active");
        
        const payload: ConsensusPayload = await response.json();
        setData(payload);
      } catch (err: any) {
        console.error("[MESH] Sync Failure:", err);
        setError("Failed to establish secure link with the Republic Node.");
      } finally {
        setIsSyncing(false);
      }
    };

    fetchConsensus();
  }, []);

  // ⏳ STATE: SYNCING (The Skeleton Loader)
  if (isSyncing) {
    return (
      <div className="bg-neutral-950 p-6 border border-neutral-800 rounded-lg font-mono text-amber-500 w-full max-w-5xl mx-auto shadow-xl shadow-black/50 flex flex-col items-center justify-center min-h-125">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
        <h2 className="text-xl font-bold tracking-widest uppercase animate-pulse">Syncing with MESH Matrix...</h2>
        <p className="text-neutral-500 text-sm mt-2">Connecting to Republic Database</p>
      </div>
    );
  }

  // 🛑 STATE: ERROR
  if (error || !data) {
    return (
      <div className="bg-neutral-950 p-6 border border-red-900 rounded-lg font-mono text-red-500 w-full max-w-5xl mx-auto flex flex-col items-center justify-center min-h-125">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold tracking-widest uppercase">Telemetry Failure</h2>
        <p className="text-neutral-500 text-sm mt-2">{error}</p>
      </div>
    );
  }

  // 🟢 STATE: LIVE RENDER
  return (
    <div className="bg-neutral-950 p-6 border border-neutral-800 rounded-lg font-mono text-amber-500 w-full max-w-5xl mx-auto shadow-xl shadow-black/50">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-amber-900/50 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-amber-500" />
          <h2 className="text-2xl font-bold tracking-widest text-amber-500 uppercase">Mesh Consensus Matrix</h2>
        </div>
        <div className={`px-4 py-2 rounded font-bold uppercase tracking-wider flex items-center space-x-2 ${data.globalEdgeReached ? "bg-emerald-950/50 text-emerald-500 border border-emerald-900" : "bg-red-950/50 text-red-500 border border-red-900"}`}>
          {data.globalEdgeReached ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span>{data.globalEdgeReached ? "Global Edge Reached" : "Consensus Failed"}</span>
        </div>
      </div>

      {/* GLOBAL STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-neutral-900 p-4 border border-neutral-800 flex flex-col items-center justify-center">
          <span className="text-sm text-neutral-400 uppercase">Tiers Passed</span>
          <span className="text-3xl font-bold">{data.tiersPassed} / 5</span>
        </div>
        <div className="bg-neutral-900 p-4 border border-neutral-800 flex flex-col items-center justify-center">
          <span className="text-sm text-neutral-400 uppercase">Global Target</span>
          <span className="text-3xl font-bold">{data.tiersRequired} Required</span>
        </div>
        <div className="bg-neutral-900 p-4 border border-neutral-800 flex flex-col items-center justify-center">
          <span className="text-sm text-neutral-400 uppercase">Network Status</span>
          <span className="text-3xl font-bold flex items-center space-x-2">
            <Activity className="w-6 h-6 text-emerald-500 animate-pulse" />
            <span>{data.networkStatus}</span>
          </span>
        </div>
      </div>

      {/* TIER BREAKDOWN */}
      <div className="space-y-4">
        {data.matrix.map((tier) => (
          <div key={tier.id} className={`p-4 border ${tier.passed ? "border-emerald-900/50 bg-emerald-950/10" : "border-red-900/50 bg-red-950/10"} flex flex-col md:flex-row items-center justify-between`}>
            
            <div className="flex items-center space-x-4 w-full md:w-1/4 mb-4 md:mb-0">
              <Users className="w-6 h-6 text-neutral-500" />
              <div>
                <h3 className="font-bold text-lg">{tier.name}</h3>
                <p className="text-xs text-neutral-500">Tier {tier.tier}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-3/4">
              <div className="flex flex-col">
                <span className="text-xs text-neutral-500">Participation (Req: {tier.quorumReq}%)</span>
                <span className={`font-bold ${tier.participation >= tier.quorumReq ? "text-emerald-500" : "text-red-500"}`}>
                  {tier.participation.toFixed(1)}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-neutral-500">Approval (Req: {tier.approvalReq}%)</span>
                <span className={`font-bold ${tier.approval >= tier.approvalReq ? "text-emerald-500" : "text-red-500"}`}>
                  {tier.approval.toFixed(1)}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-neutral-500">Votes Cast</span>
                <span className="font-bold text-amber-500">{tier.votesCast} / {tier.votesTotal}</span>
              </div>
              <div className="flex items-center justify-end">
                {tier.passed ? (
                  <span className="px-3 py-1 bg-emerald-950 text-emerald-500 text-xs font-bold uppercase rounded border border-emerald-900">Passed</span>
                ) : (
                  <span className="px-3 py-1 bg-red-950 text-red-500 text-xs font-bold uppercase rounded border border-red-900">Failed</span>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}