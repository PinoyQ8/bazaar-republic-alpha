"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getUserStakeTotal } from "@/app/actions/defiActions";

export default function DeFiVault() {
  const { pioneer } = useAuth();
  
  // 🛡️ THE WHALE SHIELD PARAMETERS
  const ABSOLUTE_CAP = 50000;
  
  // State Management
  const [activeStake, setActiveStake] = useState<number>(0); 
  const [stakeInput, setStakeInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" | "" }>({ text: "", type: "" });

  // 🛡️ THE UPLINK: HYDRATE STATE FROM DATABASE
  useEffect(() => {
    const syncLedger = async () => {
      if (pioneer?.username && pioneer.username !== "GHOST_NODE") {
        try {
          const total = await getUserStakeTotal(pioneer.username);
          setActiveStake(total);
        } catch (error) {
          console.error("[MESH-SCAN] UI Hydration Fracture:", error);
        }
      }
    };
    syncLedger();
  }, [pioneer.username]); // ◄ Re-sync if session identity changes

  const availableSpace = ABSOLUTE_CAP - activeStake;

  const handleStakeLock = async () => {
    if (!pioneer.isAuthenticated || pioneer.username === "DISCONNECTED_NODE") {
      setMessage({ text: "MESH-REJECT: Node disconnected.", type: "error" });
      return;
    }

    const amount = Number(stakeInput);
    if (amount <= 0) {
      setMessage({ text: "MESH-REJECT: Invalid payload.", type: "error" });
      return;
    }

    if (amount > availableSpace) {
      setMessage({ 
        text: `EQUITY-FRACTURE: Cap breached. You can only lock an additional ${availableSpace.toLocaleString()} mBZR.`, 
        type: "error" 
      });
      return;
    }

    setIsProcessing(true);
    setMessage({ text: "", type: "" });

    try {
      // Simulate/Trigger Lock
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setActiveStake((prev) => prev + amount);
      setStakeInput("");
      setMessage({ text: `SUCCESS: ${amount.toLocaleString()} mBZR secured in the E-Network Staking Pool.`, type: "success" });
      
    } catch (error) {
      setMessage({ text: "FATAL: Ledger unreachable.", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md p-6 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-zinc-100">
      <div className="mb-6 border-b border-zinc-800 pb-4">
        <h2 className="text-emerald-400 font-bold tracking-widest uppercase text-sm">
          Sector 3: DeFi Treasury Vault
        </h2>
        <p className="text-zinc-500 text-xs mt-1">Dynamic Yield Bridge Active</p>
      </div>

      <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-zinc-500">Node Identity:</span>
          <span className="font-bold text-emerald-300">{pioneer.username || "GHOST_NODE"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Active Stake:</span>
          <span className="font-bold">{activeStake.toLocaleString()} mBZR</span>
        </div>
        <div className="flex justify-between border-t border-zinc-800 pt-2 mt-2">
          <span className="text-zinc-500">Available Cap:</span>
          <span className={availableSpace === 0 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
            {availableSpace.toLocaleString()} mBZR
          </span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Lock Amount (mBZR)</label>
          <input 
            type="number" 
            value={stakeInput}
            onChange={(e) => setStakeInput(e.target.value)}
            disabled={availableSpace === 0}
            className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-emerald-300 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            placeholder={availableSpace === 0 ? "EQUITY CAP REACHED" : "0.00"}
          />
        </div>
      </div>

      <button 
        onClick={handleStakeLock}
        disabled={isProcessing || availableSpace === 0}
        className={`w-full py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${
          isProcessing || availableSpace === 0
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
            : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950"
        }`}
      >
        {isProcessing ? "Encrypting Lock..." : "Lock Liquidity"}
      </button>

      {message.text && (
        <div className={`mt-4 p-3 border rounded text-xs ${
          message.type === "error" ? "bg-red-950/30 border-red-900/50 text-red-400" : "bg-emerald-950/30 border-emerald-900/50 text-emerald-400"
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}