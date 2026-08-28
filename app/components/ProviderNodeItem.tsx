"use client";

import { ProviderNode } from "@/app/components/ProviderList";
import { ShieldAlert, ShieldCheck, ShieldBan } from "lucide-react"; 

export function ProviderNodeItem({ node }: { node: ProviderNode }) {
  // 1. Trust-Graph Visual Adjudicator Logic
  const getStatusDisplay = () => {
    const currentTS = node.trustScore ?? 100; 

    if (currentTS === 0 || node.status === "FROZEN") {
      return {
        style: "text-red-500 bg-red-950/30 border-red-900/50 grayscale opacity-70",
        icon: <ShieldBan className="w-3 h-3 mr-1" />,
        label: "FROZEN",
        btnStyle: "bg-neutral-800 text-neutral-600 cursor-not-allowed",
        btnLabel: "LOCKED"
      };
    }
    if (currentTS < 25) {
      return {
        style: "text-orange-500 bg-orange-950/20 border-orange-900/50",
        icon: <ShieldAlert className="w-3 h-3 mr-1" />,
        label: `WARNING (TS: ${currentTS})`,
        btnStyle: "bg-amber-600/20 text-amber-500 hover:bg-amber-600 hover:text-neutral-950",
        btnLabel: "PROCEED WITH CAUTION"
      };
    }
    return {
      style: "text-emerald-400 bg-emerald-950/20 border-emerald-900/30",
      icon: <ShieldCheck className="w-3 h-3 mr-1" />,
      label: `VERIFIED (TS: ${currentTS})`,
      btnStyle: "bg-amber-600/20 text-amber-500 hover:bg-amber-600 hover:text-neutral-950 border border-amber-600/30",
      btnLabel: "INITIATE ESCROW"
    };
  };

  const statusUI = getStatusDisplay();

  // 2. Component Render (Mobile-Optimized & Tailwind Canonical)
  return (
    <div className={`p-3 rounded border transition-all duration-200 ${statusUI.style.includes('grayscale') ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-900 border-neutral-800 hover:border-amber-500/50'}`}>
      
      {/* Header Row: Pioneer Identity & Dynamic Shield */}
      <div className="flex justify-between items-start mb-2">
        <div className="overflow-hidden">
          {/* APPLIED OPTIMIZATION: max-w-[180px] converted to max-w-45 */}
          <h3 className={`text-sm font-bold truncate max-w-45 ${statusUI.style.includes('grayscale') ? 'text-neutral-500 line-through' : 'text-amber-400'}`}>
            {node.pioneer}
          </h3>
          <p className="text-[10px] text-neutral-400 tracking-wide mt-0.5">{node.service}</p>
        </div>
        <div className={`flex items-center px-2 py-1 rounded border text-[9px] font-bold tracking-wider ${statusUI.style}`}>
          {statusUI.icon}
          {statusUI.label}
        </div>
      </div>

      {/* Metric Row: Rates */}
      <div className="mb-4">
        <p className="text-[10px] text-neutral-500 font-mono">
          BASE RATE: <span className="text-neutral-300">{node.rate}</span>
        </p>
      </div>

      {/* Footer Row: Action Trigger */}
      <div className="flex justify-between items-end border-t border-neutral-800/50 pt-3">
        {/* APPLIED OPTIMIZATION: max-w-[120px] converted to max-w-30 */}
        <p className="text-[8px] text-neutral-600 font-mono tracking-widest uppercase truncate max-w-30">
          ID: {node.id.split('-')[0] || node.id}
        </p>
        <button 
          disabled={statusUI.style.includes('grayscale')}
          className={`text-[9px] px-3 py-1.5 rounded font-bold transition-colors shadow-sm ${statusUI.btnStyle}`}
        >
          {statusUI.btnLabel}
        </button>
      </div>

    </div>
  );
}