// PROJECT BAZAAR DAO - PROTOCOL 26.1
// PAGE: SERVICE PROVIDER EXECUTION DASHBOARD

"use client";

import React, { useState } from 'react';

export default function ProviderPage() {
  const [activeTab, setActiveTab] = useState<'incoming' | 'active'>('active');
  const [contractState, setContractState] = useState<'accepted' | 'working' | 'submitted'>('working');
  const [deliverableHash, setDeliverableHash] = useState<string>('0x7f83b...491a');

  const providerTier = "Tier 3: Core Liquidity";
  const stakedBond = "10,000 mBZR";
  const trustScore = 98;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-2">
      <div className="w-[384px] p-4 bg-black text-white font-mono rounded-xl border border-zinc-800 space-y-4 shadow-2xl">
        
        {/* Header & Status */}
        <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
          <span className="text-[10px] tracking-wider uppercase opacity-75">Provider // Node #8821</span>
          <span className="px-2 py-0.5 text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-400 rounded">
            TS: {trustScore}
          </span>
        </div>

        {/* Tier Badge */}
        <div className="bg-zinc-900 p-3 rounded border border-zinc-800 text-xs space-y-1">
          <div className="flex justify-between font-bold">
            <span>{providerTier}</span>
            <span className="text-emerald-400">{stakedBond}</span>
          </div>
          <div className="text-[10px] opacity-60">Uptime Shield: 99.4% (Active)</div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 text-xs">
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 text-center uppercase tracking-wider ${activeTab === 'active' ? 'border-b-2 border-white font-bold' : 'opacity-50'}`}
          >
            Active Contract
          </button>
          <button 
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 py-2 text-center uppercase tracking-wider ${activeTab === 'incoming' ? 'border-b-2 border-white font-bold' : 'opacity-50'}`}
          >
            Incoming Briefs
          </button>
        </div>

        {/* ACTIVE CONTRACT TAB */}
        {activeTab === 'active' && (
          <div className="space-y-3">
            <div className="bg-zinc-900/60 p-3 rounded border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="opacity-60">Escrow ID:</span>
                <span className="text-emerald-400">#BZ-8821-X</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="opacity-60">Secured Amount:</span>
                <span className="font-bold">5,000 mBZR</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="opacity-60">Execution State:</span>
                <span className="text-amber-400 uppercase tracking-wider text-[10px]">{contractState}</span>
              </div>
            </div>

            {contractState === 'accepted' && (
              <button 
                onClick={() => setContractState('working')}
                className="w-full py-2.5 bg-white text-black text-xs font-bold uppercase rounded hover:opacity-90 transition"
              >
                Acknowledge & Begin Work
              </button>
            )}

            {contractState === 'working' && (
              <div className="space-y-2">
                <label className="text-[10px] opacity-60 block">Deliverable Proof Hash / URL</label>
                <input 
                  type="text" 
                  value={deliverableHash}
                  onChange={(e) => setDeliverableHash(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs rounded"
                />
                <button 
                  onClick={() => setContractState('submitted')}
                  className="w-full py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase rounded hover:bg-emerald-500 transition"
                >
                  Submit Deliverable to Consumer
                </button>
              </div>
            )}

            {contractState === 'submitted' && (
              <div className="p-3 bg-zinc-900 border border-zinc-700 rounded text-center space-y-1">
                <span className="text-xs font-bold text-emerald-400">DELIVERABLE LOGGED</span>
                <p className="text-[10px] opacity-60">Awaiting consumer review and smart contract escrow release.</p>
              </div>
            )}
          </div>
        )}

        {/* INCOMING BRIEFS TAB */}
        {activeTab === 'incoming' && (
          <div className="space-y-3">
            <div className="p-3 bg-zinc-900 rounded border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span>#BZ-8822-Y</span>
                <span className="text-emerald-400">2,500 mBZR</span>
              </div>
              <p className="text-[10px] opacity-60">Category: Digital Asset / Smart Contract Audit</p>
              <button 
                onClick={() => setActiveTab('active')}
                className="w-full mt-2 py-2 bg-zinc-800 border border-zinc-600 text-xs font-bold uppercase rounded hover:bg-zinc-700 transition"
              >
                Accept Contract Brief
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}