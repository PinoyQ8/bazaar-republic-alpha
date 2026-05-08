"use client";

import { useState, useEffect } from 'react';

interface TreasuryProps {
  citizenUID: string;
  liveAccessToken: string;
}

export default function TreasuryDashboard({ citizenUID, liveAccessToken }: TreasuryProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const syncAssets = async () => {
      setIsSyncing(true);
      try {
        // [HARD-CODED MAINNET]: This will bridge to your /api/sync-assets route
        // or directly to the Pi Horizon API in future iterations.
        const response = await fetch('/api/sync-citizen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ citizen_uid: citizenUID })
        });

        if (response.ok) {
          // Simulated balance for Alpha Phase - Replace with live wallet data
          setBalance(314.159); 
        }
      } catch (e) {
        console.error("TREASURY FAULT: Asset sync failed.");
      } finally {
        setIsSyncing(false);
      }
    };

    if (citizenUID) syncAssets();
  }, [citizenUID]);

  return (
    <div className="w-full mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
      {/* PI BALANCE CARD */}
      <div className="bg-black border border-green-900 p-4 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.1)]">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] text-green-500 uppercase font-black tracking-tighter">Liquid Treasury</span>
          <span className={`h-2 w-2 rounded-full ${isSyncing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-3xl font-black text-white">
            {isSyncing ? "---.---" : balance?.toLocaleString()}
          </h2>
          <span className="text-green-500 font-bold text-sm">π</span>
        </div>
      </div>

      {/* VAULT STATUS CARD */}
      <div className="bg-black border border-purple-900 p-4 rounded-lg">
        <span className="text-[10px] text-purple-500 uppercase font-black tracking-tighter block mb-2">Security Status</span>
        <div className="flex items-center gap-2 text-white font-bold uppercase text-sm">
          <span className="text-purple-400">Shield:</span> 
          <span className="text-green-400">ACTIVE</span>
        </div>
        <div className="text-[10px] text-gray-500 mt-1 uppercase">Mesh Uptime: 94.78%</div>
      </div>

      {/* NETWORK HASH CARD */}
      <div className="bg-black border border-blue-900 p-4 rounded-lg">
        <span className="text-[10px] text-blue-500 uppercase font-black tracking-tighter block mb-2">Node Node Latency</span>
        <div className="text-white font-bold text-sm uppercase">X570_TAICHI_CORE</div>
        <div className="text-[10px] text-blue-400 mt-1 uppercase tracking-widest animate-pulse">Scanning Ledger...</div>
      </div>
    </div>
  );
}