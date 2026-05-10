"use client";

import React, { useState } from 'react';

export default function PioneerForm() {
  // SECTOR 1: Volatile Memory (State)
  const [wallet, setWallet] = useState('');
  const [kycStatus, setKycStatus] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');

  // SECTOR 2: The Oracle Handshake (POST Logic)
  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncStatus('SYNCING');

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: wallet,
          kyc_status: kycStatus
        }),
      });

      const data = await response.json();

      // 🛡️ BRIDGE: Hard-codes the Master TS to memory upon success
      if (response.ok) {
        setSyncStatus('SUCCESS');
        localStorage.setItem('active_pioneer_node', wallet); 
        console.log("✅ MESH_SYNC_SUCCESS:", data);
      } else {
        setSyncStatus('ERROR');
        console.error("❌ MESH_REJECT:", data.error);
      }
    } catch (err) {
      setSyncStatus('ERROR');
      console.error("❌ VAULT_ACCESS_FAILED");
    }
  };

  // SECTOR 3: Viewport Render (S23 Ultra Optimized)
  return (
    <form onSubmit={handleSync} className="p-4 bg-black border border-zinc-800 rounded-lg space-y-4">
      <h2 className="text-xs font-mono text-blue-500 uppercase tracking-tighter">Pioneer_Registry_Uplink</h2>
      
      <div>
        <label htmlFor="pioneer-wallet" className="block text-[9px] text-zinc-500 mb-1">NODE_ADDRESS</label>
        <input 
          id="pioneer-wallet" 
          name="wallet_address" 
          type="text" 
          required
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="G..."
          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm font-mono text-zinc-300 focus:border-blue-500 outline-none rounded"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input 
          id="kyc-check" 
          name="kyc_status" 
          type="checkbox" 
          checked={kycStatus}
          onChange={(e) => setKycStatus(e.target.checked)}
          className="w-4 h-4 accent-blue-600 bg-zinc-900 border-zinc-700 rounded"
        />
        <label htmlFor="kyc-check" className="text-[10px] font-mono text-zinc-400">KYC_VERIFIED_PROTOCOL</label>
      </div>

      <button 
        id="btn-sync-node"
        type="submit"
        disabled={syncStatus === 'SYNCING'}
        className={`w-full py-2 font-bold text-xs uppercase tracking-widest rounded transition-all ${
          syncStatus === 'SYNCING' ? 'bg-zinc-800 text-zinc-600' : 'bg-blue-600 hover:bg-blue-500 text-white'
        }`}
      >
        {syncStatus === 'SYNCING' ? 'Syncing_Mesh...' : 'Commit_to_Ledger'}
      </button>

      {syncStatus === 'SUCCESS' && (
        <p className="text-[9px] font-mono text-green-500 text-center animate-pulse">
          {">> "} NODE_FORGED_IN_BLOCKCHAIN
        </p>
      )}

      {syncStatus === 'ERROR' && (
        <p className="text-[9px] font-mono text-red-500 text-center">
          {"!! "} SYNC_REJECTED_BY_ORACLE
        </p>
      )}
    </form>
  );
}