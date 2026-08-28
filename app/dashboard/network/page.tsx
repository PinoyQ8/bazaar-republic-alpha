// Location: /app/dashboard/network/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PioneerAuthGate from "@/app/components/PioneerAuthGate";
import LedgerTelemetry from "@/app/components/LedgerTelemetry"; // 🛡️ MESH INJECTION: Master Index UI

interface PeerNode {
  nodeId: string;
  status: string;
  uptime: number;
  region: string;
}

export default function NetworkPage() {
  const router = useRouter();
  const [session, setSession] = useState<{ username: string; uid: string } | null>(null);
  const [peers, setPeers] = useState<PeerNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorLog, setErrorLog] = useState<string | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem("pi_auth_user");
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setSession(parsed);
        
        // Fetch active MESH peers
        fetch("/api/mesh-network", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: parsed.uid }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              setErrorLog(data.error);
            } else {
              setPeers(data.peers || []);
            }
          })
          .catch((err) => {
            console.error("[MESH] Network Fetch Failure:", err);
            setErrorLog("Failed to sync with MESH daemon.");
          })
          .finally(() => setIsLoading(false));

      } catch (e) {
        console.error("[MESH] Auth parse failure", e);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-amber-500 font-mono flex flex-col items-center justify-center space-y-4">
        <div className="animate-pulse text-2xl font-bold tracking-widest">SCANNING MESH...</div>
        <div className="text-xs text-neutral-500">Querying 26.1.0 Peer Topology</div>
      </div>
    );
  }

  return (
    <PioneerAuthGate>
      {/* 🛡️ Added pb-20 so the mobile nav menu does not cover the bottom ledger logs */}
      <div className="w-full max-w-full overflow-x-hidden space-y-4 p-2 min-h-screen bg-black text-neutral-300 font-mono flex flex-col pb-20">
        
        {/* HEADER BLOCK */}
        <header className="border-b border-amber-900/60 pb-3 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight text-amber-500 uppercase">
              Network Topology
            </h1>
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-xs px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-neutral-400 hover:text-amber-400"
            >
              DASHBOARD
            </button>
          </div>
          <div className="flex justify-between text-[10px] text-neutral-500 uppercase tracking-widest">
            <span>Protocol 26.1.0</span>
            <span className="text-emerald-400">MESH STABLE</span>
          </div>
        </header>

        {/* ERROR / FALLBACK SHIELD */}
        {errorLog && (
          <div className="p-3 bg-red-950/30 border border-red-900/50 rounded text-red-400 text-xs">
            [ADJUDICATOR ALERT]: {errorLog}
          </div>
        )}

        {/* LOCAL NODE STATUS BLOCK */}
        <section className="p-3 bg-neutral-900/60 border border-amber-900/50 rounded-lg space-y-2">
          <div className="flex justify-between items-center text-xs border-b border-neutral-800 pb-2">
            <span className="text-neutral-500 uppercase tracking-widest">Local Node ID</span>
            <span className="text-amber-400 font-mono">{session?.uid ? `${session.uid.slice(0, 12)}...` : 'GHOST_MODE'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-500 uppercase tracking-widest">Uptime Shield</span>
            <span className="text-emerald-400 font-bold">90% (Active)</span>
          </div>
        </section>

        {/* PEER NODES FEED */}
        <section className="space-y-2 shrink-0">
          <h2 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest px-1">
            Connected Relay Nodes
          </h2>
          
          {peers.length === 0 ? (
            <div className="p-4 bg-neutral-900/40 border border-neutral-800 rounded text-neutral-500 text-xs text-center">
              No secondary peers found on local subnet. Operating standalone.
            </div>
          ) : (
            peers.map((peer, idx) => (
              <div key={idx} className="p-3 bg-neutral-900/40 border border-amber-900/30 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <p className="text-amber-400 font-bold">{peer.nodeId}</p>
                  <p className="text-[10px] text-neutral-500">Region: {peer.region}</p>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 text-[10px] px-2 py-0.5 bg-emerald-950/40 border border-emerald-900/50 rounded">
                    {peer.status}
                  </span>
                  <p className="text-[10px] text-neutral-500 mt-1">Uptime: {(peer.uptime * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))
          )}
        </section>

        {/* 🛡️ MASTER INDEX TELEMETRY INJECTION */}
        <section className="space-y-2 grow pt-4 border-t border-amber-900/40 mt-4">
          <h2 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest px-1">
            Live Master Index (TESTMBZR)
          </h2>
          <LedgerTelemetry />
        </section>

      </div>
    </PioneerAuthGate>
  );
}