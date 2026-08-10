// PROJECT BAZAAR DAO - PROTOCOL 26.1
// PAGE: ADJUDICATOR DISPUTE ARBITRATION QUEUE

"use client";

import React, { useState } from 'react';

interface DisputeItem {
  id: string;
  escrowId: string;
  disputingParty: string;
  stakedAmount: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED_SLASHER' | 'RESOLVED_RELEASE';
}

export default function AdjudicatorQueuePage() {
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');
  const [disputes, setDisputes] = useState<DisputeItem[]>([
    {
      id: 'DISP-8821',
      escrowId: '#BZ-8821-X',
      disputingParty: 'G-PI-NODE-7882',
      stakedAmount: '5,000 mBZR',
      reason: 'Deliverable hash mismatch / Timeout breach',
      status: 'PENDING',
    },
    {
      id: 'DISP-8825',
      escrowId: '#BZ-8825-Z',
      disputingParty: 'G-PI-NODE-9011',
      stakedAmount: '2,500 mBZR',
      reason: 'Gateway high-volume timelock anomaly (>5000 Pi)',
      status: 'PENDING',
    },
  ]);

  const handleResolve = (id: string, resolution: 'RESOLVED_SLASHER' | 'RESOLVED_RELEASE') => {
    setDisputes(prev => 
      prev.map(item => item.id === id ? { ...item, status: resolution } : item)
    );
  };

  const filteredDisputes = disputes.filter(d => filter === 'all' || d.status === 'PENDING');

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-2">
      <div className="w-[384px] p-4 bg-black text-white font-mono rounded-xl border border-zinc-800 space-y-4 shadow-2xl">
        
        {/* Header & Status */}
        <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
          <span className="text-[10px] tracking-wider uppercase text-amber-400 font-bold">⚖️ Arbitration Queue</span>
          <span className="px-2 py-0.5 text-[10px] bg-zinc-900 border border-zinc-700 rounded">
            {disputes.filter(d => d.status === 'PENDING').length} Active
          </span>
        </div>

        {/* Filter Switcher */}
        <div className="flex border-b border-zinc-800 text-xs">
          <button 
            onClick={() => setFilter('pending')}
            className={`flex-1 py-2 text-center uppercase tracking-wider ${filter === 'pending' ? 'border-b-2 border-white font-bold' : 'opacity-50'}`}
          >
            Pending Cases
          </button>
          <button 
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 text-center uppercase tracking-wider ${filter === 'all' ? 'border-b-2 border-white font-bold' : 'opacity-50'}`}
          >
            All History
          </button>
        </div>

        {/* Dispute Cards List */}
        <div className="space-y-3 max-h-105 overflow-y-auto pr-1">
          {filteredDisputes.length === 0 ? (
            <div className="p-6 text-center text-xs opacity-50">No disputes currently in the arbitration queue.</div>
          ) : (
            filteredDisputes.map((item) => (
              <div key={item.id} className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-emerald-400">{item.id}</span>
                  <span className="text-amber-400">{item.stakedAmount}</span>
                </div>
                <div className="text-[11px] opacity-75 space-y-0.5">
                  <div><span className="opacity-50">Escrow:</span> {item.escrowId}</div>
                  <div><span className="opacity-50">Node:</span> {item.disputingParty}</div>
                  <div><span className="opacity-50">Reason:</span> {item.reason}</div>
                </div>

                {item.status === 'PENDING' ? (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button 
                      onClick={() => handleResolve(item.id, 'RESOLVED_SLASHER')}
                      className="py-2 bg-red-950/80 border border-red-700 text-red-400 text-[10px] font-bold uppercase rounded hover:bg-red-900 transition"
                    >
                      Slash Bond
                    </button>
                    <button 
                      onClick={() => handleResolve(item.id, 'RESOLVED_RELEASE')}
                      className="py-2 bg-emerald-950/80 border border-emerald-700 text-emerald-400 text-[10px] font-bold uppercase rounded hover:bg-emerald-900 transition"
                    >
                      Release Escrow
                    </button>
                  </div>
                ) : (
                  <div className={`p-2 rounded text-center text-[10px] font-bold uppercase tracking-wider ${item.status === 'RESOLVED_SLASHER' ? 'bg-red-950/30 text-red-400 border border-red-900' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900'}`}>
                    {item.status === 'RESOLVED_SLASHER' ? 'Bond Slashed (Decided)' : 'Escrow Released (Decided)'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  );
}