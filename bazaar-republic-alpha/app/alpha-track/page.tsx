// TARGET FILE PATH: [project-root]/app/alpha-track/page.tsx
'use client';

import React, { useState, useEffect } from 'react';

// 1. FIXED ECONOMIC CONSTANTS (Outside Component)
const PI_TO_MBZR_RATIO = 1000;

interface MilestoneTier {
  tier: number;
  label: string;
  basePenalty: number;
}

const MILESTONE_TIERS: MilestoneTier[] = [
  { tier: 1, label: 'Tier 1: Foundation Rollout', basePenalty: 0.40 },
  { tier: 2, label: 'Tier 2: E-Network Expansion', basePenalty: 0.20 },
  { tier: 3, label: 'Tier 3: Ecosystem Maturity', basePenalty: 0.05 },
  { tier: 4, label: 'Tier 4: Mainnet Stability', basePenalty: 0.00 },
];

export default function AlphaTrackDashboard() {
  // 2. STATE HOOKS (Must remain inside the component scope)
  const [totalMinted, setTotalMinted] = useState<number>(9190);
  const [stakedReserve, setStakedReserve] = useState<number>(8010);
  const [circulatingPool, setCirculatingPool] = useState<number>(1180);
  
  const [currentTier, setCurrentTier] = useState<MilestoneTier>(MILESTONE_TIERS[0]);
  const [monthsElapsed, setMonthsElapsed] = useState<number>(0);
  const [mintInput, setMintInput] = useState<string>('');
  const [redeemInput, setRedeemInput] = useState<string>('');
  
  const currentVaultCollateralPi = totalMinted / PI_TO_MBZR_RATIO;
  const totalGoldReservedMg = totalMinted;

  const [activePenalty, setActivePenalty] = useState<number>(0.40);

  useEffect(() => {
    const calculated = Math.max(0, currentTier.basePenalty - (monthsElapsed * 0.025));
    setActivePenalty(calculated);
  }, [currentTier, monthsElapsed]);

  // 3. SECURE API ACTIONS (With typed 'prev' parameters)
  const executeMint = async (e: React.FormEvent) => {
    e.preventDefault();
    const piAmount = parseFloat(mintInput);
    if (isNaN(piAmount) || piAmount <= 0) return;

    try {
      const response = await fetch('/api/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderWallet: 'pi_test_node_01',
          lockedPiAmount: piAmount,
          l1TxSignature: `pi_tx_mock_${Date.now()}`
        })
      });

      const result = await response.json();
      if (result.success) {
        setTotalMinted((prev: number) => prev + result.telemetry.newlyMintedMbzr);
        setCirculatingPool((prev: number) => prev + result.telemetry.newlyMintedMbzr);
        setMintInput('');
      } else {
        console.error('MINT REJECTED:', result.error);
      }
    } catch (error) {
      console.error('API BRIDGE FAULT', error);
    }
  };

  const executeRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const mBzrAmount = parseFloat(redeemInput);
    if (isNaN(mBzrAmount) || mBzrAmount <= 0) return;

    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'pi_test_node_01',
          amountMbzr: mBzrAmount,
          tierBasePenalty: currentTier.basePenalty,
          monthsElapsed: monthsElapsed
        })
      });

      const result = await response.json();
      if (result.success) {
        setCirculatingPool((prev: number) => prev - mBzrAmount);
        setTotalMinted((prev: number) => prev - result.telemetry.meltBurnMbzr - result.telemetry.stakingYieldMbzr);
        setStakedReserve((prev: number) => prev + result.telemetry.stakingYieldMbzr);
        setRedeemInput('');
      } else {
        console.error('REDEEM REJECTED:', result.error);
      }
    } catch (error) {
      console.error('API BRIDGE FAULT', error);
    }
  };

  // TARGET: [project-root]/app/alpha-track/page.tsx
// Replace everything from the 'return' statement down.

  // 4. VIEWPORT RENDER (Locked for S23 Ultra)
  return (
    <main className="max-w-[384px] mx-auto p-4 min-h-screen bg-zinc-950 text-zinc-100 font-mono selection:bg-emerald-500/30">
      <div className="mb-6 border-b border-zinc-800 pb-4">
        <h2 className="text-emerald-400 font-bold tracking-widest uppercase text-sm">NEO-SYNC ACTIVE</h2>
        <p className="text-zinc-500 text-xs mt-1">Over-Mint Shield: <span className="text-emerald-500 font-bold">OPERATIONAL</span></p>
      </div>

      <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-sm space-y-3">
        <h3 className="text-xs text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-2">Proof of Reserve</h3>
        <div className="flex justify-between">
          <span className="text-zinc-500">Gold Mass:</span>
          <span className="font-bold text-amber-400">{totalGoldReservedMg.toFixed(2)} mg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Vault Pi Collateral:</span>
          <span className="font-bold text-blue-400">{currentVaultCollateralPi.toFixed(4)} Pi</span>
        </div>
        <div className="flex justify-between border-t border-zinc-800 pt-2 mt-2">
          <span className="text-zinc-500">Circulating Pool:</span>
          <span className="font-bold text-emerald-300">{circulatingPool.toFixed(2)} mBZR</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Staked Reserve:</span>
          <span className="font-bold text-purple-400">{stakedReserve.toFixed(2)} mBZR</span>
        </div>
      </div>

      {/* 🛡️ GENESIS MINT PROTOCOL */}
      <div className="mb-6 bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
        <h4 className="text-xs text-zinc-400 uppercase tracking-widest mb-3">Genesis Mint</h4>
        <form onSubmit={executeMint} className="space-y-3">
          <input 
            type="number" 
            value={mintInput} 
            onChange={(e) => setMintInput(e.target.value)} 
            placeholder="Amount Pi"
            className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded text-emerald-300 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-sm font-bold uppercase tracking-wider rounded transition-colors">
            Execute Mint
          </button>
        </form>
      </div>

      {/* 🛡️ EARLY REDEMPTION PROTOCOL */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
        <h4 className="text-xs text-zinc-400 uppercase tracking-widest mb-3">Early Redemption</h4>
        <form onSubmit={executeRedeem} className="space-y-3">
          <input 
            type="number" 
            value={redeemInput} 
            onChange={(e) => setRedeemInput(e.target.value)} 
            placeholder="Amount mBZR"
            className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded text-red-300 focus:outline-none focus:border-red-500 transition-colors"
          />
          <button type="submit" className="w-full py-3 bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700/50 text-sm font-bold uppercase tracking-wider rounded transition-colors">
            Execute Redeem
          </button>
        </form>
      </div>
    </main>
  );
}