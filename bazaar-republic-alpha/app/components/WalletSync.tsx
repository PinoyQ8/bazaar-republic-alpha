"use client";

import React, { useState } from 'react';

export default function WalletSync() {
  // SECTOR 1: State Forge (The Fix for Error 2304)
  // Initializes the volatile memory for the Pioneer Wallet string
  const [wallet, setWallet] = useState<string>('');

  return (
    <div className="wallet-sync-container p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
      <label 
        htmlFor="wallet-address-input" 
        className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2"
      >
        Pioneer_Node_Uplink
      </label>
      
      <input 
        id="wallet-address-input" 
        name="wallet_address" 
        type="text" 
        value={wallet}
        onChange={(e) => setWallet(e.target.value)} 
        placeholder="Enter Wallet Address (G...)" 
        className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm font-mono text-blue-400 focus:outline-none focus:border-blue-500 rounded transition-colors"
      />
      
      <div className="mt-3 flex justify-between items-center">
        <span className="text-[9px] font-mono text-zinc-600 uppercase">
          Status: {wallet ? "Buffer_Loaded" : "Awaiting_Input"}
        </span>
        {wallet && (
          <span className="text-[9px] font-mono text-blue-500 animate-pulse">
            MESH_READY
          </span>
        )}
      </div>
    </div>
  );
}