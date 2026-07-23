"use client";

import React, { useState } from "react";

interface MeshStakingProps {
  pioneerUid?: string; // 🛡️ Optional fallback to prevent TS2741
  currentStake?: number; // 🛡️ Optional fallback to prevent TS2741
  onStakeSuccess?: () => void; // 🛡️ Restored to maintain the Phase 02 lock in page.tsx
}

export default function MeshStaking({ 
  pioneerUid = "PENDING_NODE", 
  currentStake = 0, 
  onStakeSuccess 
}: MeshStakingProps) {
  const [amount, setAmount] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState<boolean>(false);

  const executeLock = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setStatus("FRACTURE: Invalid numeric stake value.");
      return;
    }

    setIsLocking(true);
    setStatus("SYNCING LOCK CONTRACT...");

    try {
      // 🚀 THE BRIDGE: This will connect to a new Server Action we forge next
      // const response = await lockPioneerStake(pioneerUid, parseFloat(amount));
      
      // Temporary simulated delay until Server Action is forged
      await new Promise(resolve => setTimeout(resolve, 1200)); 
      
      setStatus(`🟢 SHIELD ACTIVE: ${amount} mBZR Locked.`);
      setAmount("");

      // 🛡️ THE BRIDGE: Signal the master dashboard to unlock Phase 03
      if (onStakeSuccess) {
        // Small timeout so the Pioneer sees the success message before the UI shifts
        setTimeout(() => {
          onStakeSuccess();
        }, 1000);
      }

    } catch (error) {
      setStatus("❌ FRACTURE: Ledger sync failed.");
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="p-6 bg-neutral-950 border border-cyan-900/50 rounded-xl shadow-xl text-neutral-200 w-full font-mono text-xs relative overflow-hidden">
      
      {/* Visual Tech Accent - Updated Syntax */}
<div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

      <h2 className="text-sm font-black text-cyan-400 mb-4 border-b border-neutral-900 pb-2 uppercase tracking-widest flex justify-between">
        <span>MESH Liquidity Lock</span>
        <span className="text-neutral-600">[{pioneerUid.slice(0,8)}...]</span>
      </h2>
      
      <div className="mb-6 bg-neutral-900/40 p-4 rounded border border-neutral-800/50 flex justify-between items-center">
        <span className="text-neutral-500 uppercase tracking-wider">Current Shield</span>
        <span className="text-cyan-400 font-bold text-lg">{currentStake} mBZR</span>
      </div>

      <div className="mb-4">
        <label className="block text-[10px] text-neutral-500 uppercase font-bold mb-2">Stake Allocation</label>
        <input 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter mBZR to lock..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-3 text-cyan-400 focus:border-cyan-500 focus:outline-none transition-colors"
          disabled={isLocking}
        />
      </div>

      <button 
        onClick={executeLock}
        disabled={isLocking || !amount}
        className={`w-full py-3 font-black rounded uppercase tracking-widest transition-all text-[11px] ${
          isLocking 
            ? "bg-neutral-800 text-neutral-600 cursor-not-allowed border border-neutral-700" 
            : "bg-cyan-700 hover:bg-cyan-600 text-white shadow-[0_0_15px_rgba(0,255,255,0.2)]"
        }`}
      >
        {isLocking ? "[ Engaging Smart Contract... ]" : "[ Lock Liquidity ]"}
      </button>

      {status && (
        <div className={`mt-4 p-3 rounded border text-[10px] tracking-wide text-center uppercase font-bold ${
          status.includes('SHIELD ACTIVE') ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' : 
          status.includes('SYNCING') ? 'bg-cyan-950/30 border-cyan-900 text-cyan-400 animate-pulse' : 
          'bg-rose-950/30 border-rose-900 text-rose-400'
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}