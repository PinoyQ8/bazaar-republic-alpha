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

  // 4. VIEWPORT RENDER (Locked for S23 Ultra)
  return (
    <main style={{ maxWidth: '384px', margin: '0 auto', padding: '16px' }}>
      <div>
        <h2>NEO-SYNC ACTIVE</h2>
        <p>Over-Mint Shield: OPERATIONAL</p>
      </div>
      
      <hr />

      <div>
        <h3>PROOF OF RESERVE</h3>
        <p>Gold Mass: {totalGoldReservedMg.toFixed(2)} mg</p>
        <p>Vault Pi Collateral: {currentVaultCollateralPi.toFixed(4)} Pi</p>
        <p>Circulating Pool: {circulatingPool.toFixed(2)} mBZR</p>
        <p>Staked Reserve: {stakedReserve.toFixed(2)} mBZR</p>
      </div>

      {/* Forms to trigger the functions */}
      <div style={{ marginTop: '24px' }}>
        <h4>Genesis Mint</h4>
        <form onSubmit={executeMint}>
          <input 
            type="number" 
            value={mintInput} 
            onChange={(e) => setMintInput(e.target.value)} 
            placeholder="Amount Pi"
            style={{ width: '100%', marginBottom: '8px' }}
          />
          <button type="submit" style={{ width: '100%' }}>Execute Mint</button>
        </form>
      </div>

      <div style={{ marginTop: '24px' }}>
        <h4>Early Redemption</h4>
        <form onSubmit={executeRedeem}>
          <input 
            type="number" 
            value={redeemInput} 
            onChange={(e) => setRedeemInput(e.target.value)} 
            placeholder="Amount mBZR"
            style={{ width: '100%', marginBottom: '8px' }}
          />
          <button type="submit" style={{ width: '100%' }}>Execute Redeem</button>
        </form>
      </div>
    </main>
  );
}