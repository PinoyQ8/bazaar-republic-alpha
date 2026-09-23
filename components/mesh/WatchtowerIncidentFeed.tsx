"use client";

import React, { useEffect, useState } from "react";

interface QuarantinedNode {
  uid: string;
  status: string;
  quarantineStatus: string;
  freezeReason: string;
  quarantineDate: string;
}

export function WatchtowerIncidentFeed() {
  const [nodes, setNodes] = useState<QuarantinedNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/mesh/watchtower/feed");
      const data = await res.json();
      if (data.success) {
        setNodes(data.quarantinedNodes || []);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error("Failed to load Watchtower feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-red-900/40 bg-zinc-950/80 p-5 backdrop-blur-md shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold tracking-wider text-zinc-100 uppercase">
              Watchtower Defense & Quarantine Registry
            </h3>
            <p className="text-xs text-zinc-400">
              Autonomous Soroban state-dispute & node isolation telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-500">
            Synced: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchFeed}
            disabled={loading}
            className="rounded bg-zinc-900 px-2.5 py-1 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white transition disabled:opacity-50"
          >
            {loading ? "Syncing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="text-[11px] font-mono text-zinc-400 uppercase">Quarantined Nodes</div>
          <div className="mt-1 font-mono text-xl font-bold text-red-400">{nodes.length}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="text-[11px] font-mono text-zinc-400 uppercase">Defense Stance</div>
          <div className="mt-1 font-mono text-xl font-bold text-emerald-400">ACTIVE</div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-mono text-zinc-400 uppercase">Challenge Mode</div>
          <div className="mt-1 font-mono text-xl font-bold text-amber-400">Soroban L1</div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
          Enforced Violations
        </div>

        {nodes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center">
            <p className="text-xs font-mono text-zinc-500">
              No nodes currently quarantined. The MESH protocol is operating cleanly.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/30">
            {nodes.map((node) => (
              <div key={node.uid} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-zinc-200">
                      {node.uid}
                    </span>
                    <span className="rounded bg-red-950/80 border border-red-800/60 px-1.5 py-0.5 text-[10px] font-mono text-red-300 uppercase">
                      {node.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-red-400/90 break-words">
                    {node.freezeReason}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono text-zinc-500 block">
                    {node.quarantineDate
                      ? new Date(node.quarantineDate).toLocaleDateString() + " " + new Date(node.quarantineDate).toLocaleTimeString()
                      : "Recently Enforced"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
