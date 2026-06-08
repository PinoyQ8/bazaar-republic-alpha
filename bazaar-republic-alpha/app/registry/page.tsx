'use client'; // 🛡️ Ensure this remains a client component for telemetry fetching

import { useState, useEffect } from 'react';
import Link from "next/link";
import { SecurityCircle } from "../components/SecurityCircle";
import AttritionLog from "../components/AttritionLog";
import NodeMonitor from "@/app/components/mesh/node-monitor";

export default function RegistryPage() {
  const [registry, setRegistry] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🛡️ FETCH: Pull aggregated registry data from the MESH-BRIDGE
    fetch('/api/registry/sync')
      .then(res => res.json())
      .then(data => {
        setRegistry(data.directory || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("TELEMETRY_SYNC_FAILURE:", err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-black text-slate-200 p-4 pb-52">
      {/* 🛰️ SECTOR HEADER */}
      <div className="mb-8 pt-6">
        <h1 className="text-xs font-bold tracking-[0.5em] text-blue-500 uppercase mb-2">
          Sector: Genesis Registry
        </h1>
        <div className="h-px w-full bg-linear-to-r from-blue-500/50 to-transparent" />
        <p className="text-[9px] text-slate-500 mt-4 uppercase leading-relaxed">
          Verified pioneers are indexed via the Telemetry Vault.
        </p>
      </div>

      <SecurityCircle />

      {/* 🟢 LIVE TELEMETRY BRIDGE */}
      <div className="mt-8 mb-4">
        <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2">
          Validated Infrastructure Node
        </div>
        <NodeMonitor />
      </div>

      {/* 🛡️ PIONEER DIRECTORY */}
        <div className="mt-8 space-y-2">
          <div className="text-[9px] text-blue-500/50 uppercase tracking-widest mb-4">
            {loading ? "Syncing Directory..." : `Active Directory (${registry.length})`}
          </div>
          
          {/* 🛡️ BAZAAR TECH: Prisma-Aligned Data Mapping */}
          {!loading && registry.map((node) => (
            <div key={node.uid} className="flex justify-between items-center p-3 border border-slate-800 bg-slate-900/20 rounded-md">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-slate-200">{node.username}</span>
                <span className="text-[8px] text-slate-500 uppercase tracking-wider mt-1">
                  Tier: {node.tier} | Node UID: {node.uid.split('-')[0]}***
                </span>
              </div>
              <span className="text-[8px] text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded tracking-widest uppercase">
                🛡️ {node.status}
              </span>
            </div>
          ))}
        </div>

      {/* 📊 TELEMETRY FOOTER */}
      <div className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md border-t border-slate-800 z-50">
        <AttritionLog />
        <div className="flex justify-center gap-6 py-3 text-[9px] font-mono text-slate-600 uppercase border-t border-slate-800/50">
          <Link href="/terms" className="hover:text-blue-500 transition-colors">Terms of the Republic</Link>
          <Link href="/privacy" className="hover:text-green-500 transition-colors">Privacy Protocol</Link>
        </div>
      </div>
    </main>
  );
}