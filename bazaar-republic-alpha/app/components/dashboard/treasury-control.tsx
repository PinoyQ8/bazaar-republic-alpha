// Route: /components/dashboard/treasury-control.tsx
// Logic: mBZR Treasury Allocation Terminal (MESH Hardened)

"use client";

import React, { useState } from 'react';

export default function TreasuryControl() {
  const [targetUid, setTargetUid] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [adminKey, setAdminKey] = useState("");
  const [status, setStatus] = useState<"IDLE" | "TRANSMITTING" | "SUCCESS" | "ERROR">("IDLE");
  const [terminalLog, setTerminalLog] = useState<string>("Awaiting command...");

  const executeAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetUid || !amount || !adminKey) {
      setTerminalLog("[ERROR] MESH-SCAN: Missing parameters. All fields are required.");
      setStatus("ERROR");
      return;
    }

    setStatus("TRANSMITTING");
    setTerminalLog(`[UPLINK] Routing ${amount} mBZR to Pioneer: ${targetUid}...`);

    try {
      const response = await fetch("/api/treasury/allocate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUid,
          amount: Number(amount),
          actionKey: adminKey, // Zero-Trust verification payload
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ledger mutation rejected.");
      }

      setTerminalLog(`[SUCCESS] Vault updated. Pioneer now holds ${data.newBalance} mBZR.`);
      setStatus("SUCCESS");
      
      // Clear inputs for the next transaction
      setTargetUid("");
      setAmount("");
      
    } catch (error: any) {
      console.error("[MESH-FRACTURE] Allocation Failed:", error);
      setTerminalLog(`[CRITICAL] Transaction aborted: ${error.message}`);
      setStatus("ERROR");
    }
  };

  return (
    <div className="bg-black border border-emerald-900 rounded-lg p-6 max-w-md w-full font-mono shadow-2xl">
      <div className="border-b border-emerald-900 pb-4 mb-6">
        <h2 className="text-xl text-emerald-500 font-bold tracking-widest uppercase">
          Sector 02: Treasury
        </h2>
        <p className="text-slate-500 text-xs mt-1">mBZR Master Allocation Node</p>
      </div>

      <form onSubmit={executeAllocation} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Target Pioneer UID</label>
          <input 
            type="text" 
            value={targetUid}
            onChange={(e) => setTargetUid(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 focus:border-emerald-500 focus:outline-none transition-colors"
            placeholder="Enter exact Pi UID"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">mBZR Allocation Amount</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 focus:border-emerald-500 focus:outline-none transition-colors"
            placeholder="e.g., 500"
            min="1"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Vault Authorization Key</label>
          <input 
            type="password" 
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-emerald-400 focus:border-emerald-500 focus:outline-none transition-colors font-sans tracking-widest"
            placeholder="••••••••••••"
          />
        </div>

        <button 
          type="submit"
          disabled={status === "TRANSMITTING"}
          className="w-full mt-2 bg-emerald-900/40 border border-emerald-600 text-emerald-400 font-bold py-3 uppercase tracking-widest hover:bg-emerald-800 hover:text-white transition-all disabled:opacity-50"
        >
          {status === "TRANSMITTING" ? "MUTATING LEDGER..." : "EXECUTE TRANSFER"}
        </button>
      </form>

      {/* Embedded Terminal Output */}
      <div className="mt-6 bg-slate-950 border border-slate-800 rounded p-3 h-20 overflow-y-auto">
        <p className={`text-xs ${status === 'ERROR' ? 'text-red-500' : status === 'SUCCESS' ? 'text-emerald-400' : 'text-slate-500'}`}>
          {terminalLog}
        </p>
      </div>
    </div>
  );
}