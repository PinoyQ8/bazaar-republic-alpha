"use client";

import { useState } from "react";
import { ShieldCheck, Lock, Plus } from "lucide-react";

export default function MerchantEscrowPortal() {
  const [activeTab, setActiveTab] = useState<'vaults' | 'create'>('vaults');
  const vaults = []; // Placeholder array for MESH ledger sync

  return (
    <div className="w-full max-w-[384px] mx-auto space-y-4 p-2 font-sans">
      
      {/* 🛡️ PI NETWORK ENCLOSED MAINNET COMPLIANCE BANNER */}
      <div className="bg-purple-950/40 border border-purple-800/80 p-3 rounded-2xl flex items-center justify-between font-mono text-[10px] text-purple-300">
        <span className="flex items-center gap-1.5 font-bold">
          <ShieldCheck size={14} className="text-purple-400" /> Pi Ecosystem Compliant
        </span>
        <span className="bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded font-bold uppercase border border-purple-700">
          100% Settled in Pi (PI)
        </span>
      </div>

      {/* 🛡️ HERO TITLE & TAB SELECTOR */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <ShieldCheck size={18} className="text-indigo-400" /> E-Network Merchant Escrow
            </h1>
            <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
              48-Hour Timelock • Passkey Vaults • 5-Elder Council
            </p>
          </div>
        </div>

        {/* 🛡️ TAB BUTTONS (Syntax Patched) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-950 rounded-2xl border border-neutral-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('vaults')}
            className={`py-2 rounded-xl transition font-bold flex items-center justify-center gap-1.5 ${
              activeTab === 'vaults'
                ? 'bg-indigo-950 border border-indigo-700 text-indigo-300'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Lock size={14} /> Active Vaults ({vaults.length})
          </button>
          
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 rounded-xl transition font-bold flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-indigo-950 border border-indigo-700 text-indigo-300'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Plus size={14} /> Lock New Vault
          </button>
        </div>
      </div>

      {/* 🛡️ DYNAMIC TAB RENDERING MATRIX */}
      <div className="mt-4">
        {activeTab === 'vaults' ? (
          <div className="text-center text-neutral-500 font-mono text-xs py-10 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/30">
            [MESH-SYNC] No active escrow vaults found.
          </div>
        ) : (
          <div className="text-center text-neutral-500 font-mono text-xs py-10 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/30">
            [VAULT-FORGE] Initializing lock sequence...
          </div>
        )}
      </div>

    </div>
  );
}