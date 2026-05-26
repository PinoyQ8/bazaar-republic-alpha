"use client"; // 🛡️ Marks this as a Client Component, enabling React hooks & onClick

import { TierGuard } from "./TierGuard";

interface ProviderNode {
  id: string;
  pioneer: string;
  service: string;
  rate: string;
  status: string;
}

export function ProviderNodeItem({ node }: { node: ProviderNode }) {
  const handleContract = (id: string) => {
    console.log(`[MESH-SYNC] Initiating contract for node: ${id}`);
    // Add your contract logic here
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col hover:border-emerald-500/30 transition-all shadow-sm">
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
        
        {/* 🛡️ RBAC PROTECTED GATE */}
        <TierGuard 
          allowedTiers={["PIONEER", "ELDER", "ADMIN"]} 
          fallback={
            <button className="px-4 py-1 bg-slate-900 text-[10px] font-mono text-slate-500 border border-slate-800 rounded cursor-not-allowed">
              RESTRICTED
            </button>
          }
        >
          <button 
            onClick={() => handleContract(node.id)}
            className="px-4 py-1 bg-slate-800 text-[10px] font-mono text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-600/20 transition-all"
          >
            CONTRACT
          </button>
        </TierGuard>
      </div>
    </div>
  );
}