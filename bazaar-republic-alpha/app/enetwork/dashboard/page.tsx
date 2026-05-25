import React from "react";
import Link from "next/link";
import { getActiveProviders } from "@/app/actions/enetworkActions";

// 🛡️ MESH UI: Server-Side Rendered E-Network Hub
export default async function Dashboard() {
  // 🧠 Data is fetched on the server before the page reaches the client.
  // This is the correct, optimized MESH pattern.
  const providers = await getActiveProviders();

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 animate-in fade-in duration-700">
      <div className="flex flex-col flex-1 w-full max-w-sm mx-auto h-screen relative">
        
        {/* Sticky Header */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="font-mono text-lg font-bold text-slate-100 uppercase tracking-tighter leading-none">E-Network Hub</h1>
                <p className="text-[9px] font-mono text-emerald-500 tracking-widest uppercase mt-1">Provider Ledger Sync</p>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 Live Provider Ledger */}
        <div className="flex-1 overflow-y-auto px-4 pt-28 pb-24 custom-scrollbar space-y-3">
          {providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">No Active Nodes in MESH</p>
            </div>
          ) : (
            providers.map((node: any) => (
              <div key={node.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col hover:border-emerald-500/30 transition-all shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-mono font-bold text-slate-200">{node.service}</h3>
                    <p className="text-[10px] font-mono text-slate-400">Node: {node.pioneer}</p>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-900 text-emerald-400 text-[8px] font-mono uppercase tracking-widest">
                    {node.status}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/50">
                  <span className="text-[10px] font-mono text-blue-400 font-bold">{node.rate}</span>
                  <button className="px-4 py-1 bg-slate-800 text-[10px] font-mono text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-600/20 transition-all">
                    CONTRACT
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sticky Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-950/90 border-t border-slate-800 backdrop-blur-md">
          <Link href="/enetwork/register" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-xl transition-all uppercase tracking-widest flex items-center justify-center">
            Register as Provider
          </Link>
        </div>
      </div>
    </div>
  );
}