// PROJECT BAZAAR DAO - PROTOCOL 26.1
// PAGE: CONSUMER ESCROW DASHBOARD

"use client";

import React, { useState } from 'react';

export default function ConsumerPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [providerId, setProviderId] = useState<string>("G-PI-NODE-7882");
  const [escrowAmount, setEscrowAmount] = useState<number>(5000);
  const [isDisputed, setIsDisputed] = useState<boolean>(false);

  const protocolFee = escrowAmount * 0.025;
  const burnAllocation = protocolFee * 0.40;
  const yieldAllocation = protocolFee * 0.40;
  const treasuryAllocation = protocolFee * 0.20;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-2">
      <div className="w-[384px] p-4 bg-black text-white font-mono rounded-xl border border-zinc-800 shadow-2xl">
        
        {/* Header Badge */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800">
          <span className="text-xs tracking-wider uppercase opacity-75">Project Bazaar // Escrow</span>
          <span className="px-2 py-0.5 text-[10px] bg-zinc-900 border border-zinc-700 rounded">
            Step {step} of 4
          </span>
        </div>

        {/* STEP 1: THE BRIEF (DRAFT) */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase">1. Initialize Escrow Brief</h2>
            <div>
              <label className="text-xs opacity-60 block mb-1">Provider Node ID</label>
              <input 
                type="text" 
                value={providerId} 
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs rounded"
              />
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">Escrow Amount (mBZR)</label>
              <input 
                type="number" 
                value={escrowAmount} 
                onChange={(e) => setEscrowAmount(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs rounded"
              />
            </div>
            <div className="bg-zinc-900/50 p-3 rounded border border-zinc-800 text-[11px] space-y-1">
              <div className="flex justify-between"><span>Protocol Fee (2.5%):</span><span>{protocolFee} mBZR</span></div>
              <div className="flex justify-between opacity-60"><span>- Burned (40%):</span><span>{burnAllocation} mBZR</span></div>
              <div className="flex justify-between opacity-60"><span>- The Shield (40%):</span><span>{yieldAllocation} mBZR</span></div>
              <div className="flex justify-between opacity-60"><span>- Treasury (20%):</span><span>{treasuryAllocation} mBZR</span></div>
            </div>
            <button 
              onClick={() => setStep(2)}
              className="w-full py-2.5 bg-white text-black text-xs font-bold uppercase rounded hover:opacity-90 transition"
            >
              Sign & Lock Collateral
            </button>
          </div>
        )}

        {/* STEP 2: THE LOCK (COLLATERAL DEPLOYMENT) */}
        {step === 2 && (
          <div className="space-y-4 text-center py-6">
            <div className="inline-block p-3 bg-zinc-900 border border-zinc-700 rounded-full mb-2">
              🔒
            </div>
            <h2 className="text-sm font-bold uppercase">Funds Secured</h2>
            <p className="text-xs opacity-60 px-4">
              Pi Wallet signature verified. {escrowAmount} mBZR successfully locked in the MESH Vault.
            </p>
            <button 
              onClick={() => setStep(3)}
              className="w-full py-2.5 bg-zinc-800 border border-zinc-600 text-xs font-bold uppercase rounded hover:bg-zinc-700 transition"
            >
              View Active Contract
            </button>
          </div>
        )}

        {/* STEP 3: THE FORGE (ACTIVE WORK) */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase">3. Active Execution</h2>
            <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between"><span className="opacity-60">Status:</span><span className="text-emerald-400">Provider Working</span></div>
              <div className="flex justify-between"><span className="opacity-60">Deadline:</span><span>23h 45m Remaining</span></div>
              <div className="flex justify-between"><span className="opacity-60">Escrow ID:</span><span>#BZ-8821-X</span></div>
            </div>
            <p className="text-[11px] opacity-60 text-center">
              Parameter modifications locked by smart contract. Awaiting provider delivery submission.
            </p>
            <button 
              onClick={() => setStep(4)}
              className="w-full py-2.5 bg-white text-black text-xs font-bold uppercase rounded hover:opacity-90 transition"
            >
              Simulate Deliverable Complete
            </button>
          </div>
        )}

        {/* STEP 4: THE FORK (RESOLUTION) */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase">4. Binary Resolution</h2>
            <p className="text-xs opacity-60">
              Deliverable submitted. Select final transaction action to execute smart contract settlement.
            </p>
            
            {isDisputed ? (
              <div className="p-3 bg-red-950/30 border border-red-800/50 rounded text-xs text-center space-y-2">
                <span className="font-bold text-red-400">DISPUTE TRIGGERED</span>
                <p className="text-[10px] opacity-75">Adjudication Bond posted. Summoning Genesis 100 Seating Elders via VRF.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <button 
                  onClick={() => alert("Escrow Released! mBZR routed to Provider.")}
                  className="w-full py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase rounded hover:bg-emerald-500 transition"
                >
                  Approve & Release Funds
                </button>
                <button 
                  onClick={() => setIsDisputed(true)}
                  className="w-full py-2.5 bg-red-950/50 border border-red-800 text-red-400 text-xs font-bold uppercase rounded hover:bg-red-900/50 transition"
                >
                  Trigger Dispute (Bond Required)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}