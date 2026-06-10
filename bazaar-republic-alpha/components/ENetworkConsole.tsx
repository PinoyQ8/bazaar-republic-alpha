'use client';

import React, { useState } from 'react';

export default function ENetworkConsole() {
  // Sector 1: Network Balance Metrics States
  const [networkEquity, setNetworkEquity] = useState<number>(0.00);
  const [activeFuel, setActiveFuel] = useState<number>(0.00);
  const [vestingShield, setVestingShield] = useState<number>(0.00);
  
  // Sector 2: POS Transaction States
  const [cartValue, setCartValue] = useState<number>(0.00);
  
  // Sector 3: DeFi Treasury Staking States
  const [lockAmount, setLockAmount] = useState<number>(0);
  const [activeStake, setActiveStake] = useState<number>(0);

  // Sector 4: Vault Defense Simulation States
  const [defenseStatus, setDefenseStatus] = useState<'IDLE' | 'ALERT' | 'ESCROW_LOCKED'>('IDLE');

  const triggerDrainSimulation = () => {
    setDefenseStatus('ALERT');
    console.warn("⚠️ ZERO TRUST DETECTED: Simulating high-volume exploit drain...");
    setTimeout(() => {
      setDefenseStatus('ESCROW_LOCKED');
      console.log("🛡️ SHIELD ACTION: Defensive automated escrow engaged. Assets protected.");
    }, 1500);
  };

  return (
    <div className="w-full max-w-90 mx-auto space-y-4 font-mono text-xs">
      
      {/* 🟢 SECTOR 1: BAZAAR REPUBLIC CORE NODE */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 shadow-xl text-neutral-200">
        <div className="flex justify-between items-center border-b border-neutral-900 pb-2 mb-3">
          <span className="font-black tracking-widest text-amber-500 uppercase">Bazaar Republic</span>
          <span className="text-[10px] bg-neutral-900 px-2 py-0.5 rounded text-emerald-400 font-bold tracking-wider">
            NODE ACTIVE
          </span>
        </div>
        
        <div className="text-center py-2">
          <span className="text-[10px] text-neutral-500 block uppercase tracking-wider">Total Network Equity</span>
          <h2 className="text-xl font-black text-neutral-100">{networkEquity.toFixed(2)} <span className="text-amber-500 text-xs">Test-Pi</span></h2>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
          <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800/40">
            <span className="text-neutral-500 block">SHIELD HEALTH</span>
            <span className="text-emerald-400 font-bold">150% 🟢</span>
          </div>
          <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800/40">
            <span className="text-neutral-500 block">ACTIVE FUEL</span>
            <span className="text-amber-500 font-bold">{activeFuel.toFixed(2)}</span>
          </div>
          <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800/40 col-span-2 flex justify-between items-center">
            <span className="text-neutral-500">🔒 VESTING SHIELD</span>
            <span className="text-purple-400 font-bold">{vestingShield.toFixed(2)}</span>
          </div>
        </div>

        <button className="w-full bg-neutral-900 border border-neutral-800 text-amber-500 font-bold uppercase tracking-widest py-2 rounded mt-3 hover:bg-neutral-800 transition-all text-[10px]">
          Claim MESH Yield
        </button>
      </div>

      {/* 🏪 SECTOR 2: BAZAAR E-NETWORK POS */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 shadow-xl text-neutral-200">
        <h3 className="font-bold text-amber-500 border-b border-neutral-900 pb-2 mb-3 tracking-wider uppercase text-[11px]">
          Bazaar E-Network POS
        </h3>
        <div className="space-y-1 text-[10px] bg-neutral-900/40 p-2 rounded border border-neutral-800/50 mb-3">
          <div><span className="text-neutral-500">👤 BUYER:</span> <span className="text-neutral-300">GHOST_NODE</span></div>
          <div><span className="text-neutral-500">🏪 MERCHANT:</span> <span className="text-cyan-400">SYSTEM_DAO_COLLECTOR</span></div>
        </div>
        <div className="mb-3">
          <label className="text-[10px] text-neutral-500 block mb-1 uppercase font-bold">Cart Value (mBZR)</label>
          <input 
            type="number"
            value={cartValue}
            onChange={(e) => setCartValue(parseFloat(e.target.value) || 0)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-amber-400 text-sm focus:outline-none"
          />
        </div>
        <button className="w-full bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black uppercase tracking-widest py-2 rounded transition-all text-[10px]">
          Execute Settlement
        </button>
      </div>

      {/* 🏦 SECTOR 3: DEFI TREASURY VAULT */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 shadow-xl text-neutral-200">
        <div className="flex justify-between items-center border-b border-neutral-900 pb-2 mb-3">
          <span className="font-bold text-amber-500 tracking-wider text-[11px] uppercase">Sector 3: DeFi Treasury Vault</span>
          <span className="text-[8px] text-cyan-400 border border-cyan-800/50 px-1 rounded animate-pulse">DYNAMIC BRIDGE ACTIVE</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] mb-3 bg-neutral-900/40 p-2 rounded border border-neutral-800/50">
          <div><span className="text-neutral-500 block">Node Identity:</span> <span className="text-neutral-300">@GHOST_NODE</span></div>
          <div><span className="text-neutral-500 block">Active Stake:</span> <span className="text-purple-400 font-bold">{activeStake} mBZR</span></div>
          <div className="col-span-2 border-t border-neutral-900 pt-1 mt-1">
            <span className="text-neutral-500">Available Cap:</span> <span className="text-cyan-400 font-bold">50,000 mBZR</span>
          </div>
        </div>
        <div className="mb-3">
          <label className="text-[10px] text-neutral-500 block mb-1 uppercase font-bold">Lock Amount (mBZR)</label>
          <input 
            type="number"
            value={lockAmount}
            onChange={(e) => setLockAmount(parseInt(e.target.value) || 0)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-purple-400 font-bold text-sm focus:outline-none"
          />
        </div>
        <button 
          onClick={() => { setActiveStake(prev => prev + lockAmount); setLockAmount(0); }}
          className="w-full bg-linear-to-r from-purple-900 to-indigo-900 border border-purple-700 text-purple-200 font-bold uppercase tracking-widest py-2 rounded text-[10px]"
        >
          LOCK LIQUIDITY
        </button>
      </div>

      {/* 🛡️ SECTOR 4: CITIZEN VAULT DEFENSE GRID */}
      <div className={`border rounded-xl p-4 shadow-xl transition-all duration-300 ${
        defenseStatus === 'ESCROW_LOCKED' 
          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' 
          : defenseStatus === 'ALERT'
          ? 'bg-rose-950/40 border-rose-500 text-rose-500 animate-bounce'
          : 'bg-neutral-950 border-neutral-800 text-neutral-200'
      }`}>
        <div className="flex justify-between items-center border-b border-neutral-900/60 pb-2 mb-3">
          <span className="font-bold tracking-wider text-[11px] uppercase flex items-center gap-1">
            🔒 Citizen Vault Defense Grid
          </span>
          <span className="text-[9px] font-black tracking-widest bg-black px-1.5 py-0.5 rounded border border-neutral-800 text-neutral-400">
            {defenseStatus}
          </span>
        </div>
        <p className="text-[10px] text-neutral-500 mb-3 leading-relaxed">
          {defenseStatus === 'ESCROW_LOCKED' 
            ? '🚨 DEFENSE LAYER TRIPPED: Exploitive drain intercepted. Funds locked into multisig escrow.' 
            : 'ZERO TRUST: Simulate high-volume drain scenarios to verify real-time algorithmic defensive escrow deployment.'}
        </p>
        <button 
          onClick={triggerDrainSimulation}
          disabled={defenseStatus !== 'IDLE'}
          className="w-full bg-rose-950 text-rose-400 border border-rose-800 font-bold uppercase tracking-widest py-2.5 rounded hover:bg-rose-900 transition-all text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Simulate Exploitive Drain Check
        </button>
      </div>

    </div>
  );
}