// Location: app/alpha-track/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { ArrowLeft, Cpu, Zap, ShieldAlert, Loader2, Network, CheckCircle2, Activity, Clock, RotateCcw } from 'lucide-react';
import { useMeshCurrency } from "@/app/hooks/useMeshCurrency"; // 🛡️ INJECTED CURRENCY HOOK

// 🛡️ ECONOMIC CONSTANTS (Pure Algorithmic Peg)
const PI_TO_MBZR_RATIO = 1000;
const GENESIS_STAKE_AMOUNT = 100;

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

export default function AlphaTrackModule() {
  const { pioneer, executeStakePayment } = useAuth();
  
  // 🛡️ INITIALIZE DYNAMIC CURRENCY
  const { text: piText, symbol: piSymbol } = useMeshCurrency();

  // 🛡️ PHASE 1 STATE: Soroban Staking
  const [isStaking, setIsStaking] = useState(false);
  const [txLog, setTxLog] = useState<string[]>([]);
  const [stakeError, setStakeError] = useState<string | null>(null);

  // 🛡️ PHASE 2 STATE: Economic Engine (Mint/Redeem)
  const [totalMinted, setTotalMinted] = useState<number>(9190);
  const [stakedReserve, setStakedReserve] = useState<number>(8010);
  const [circulatingPool, setCirculatingPool] = useState<number>(1180);
  
  const [currentTier, setCurrentTier] = useState<MilestoneTier>(MILESTONE_TIERS[0]);
  const [monthsElapsed, setMonthsElapsed] = useState<number>(0);
  const [mintInput, setMintInput] = useState<string>('');
  const [redeemInput, setRedeemInput] = useState<string>('');
  const [activePenalty, setActivePenalty] = useState<number>(0.40);

  // Computed Values
  const currentVaultCollateralPi = totalMinted / PI_TO_MBZR_RATIO;
  const isGuardian = pioneer.tier === 'MESH_GUARDIAN' || pioneer.tier === 'BAZAAR_FOUNDER';

  useEffect(() => {
    const calculated = Math.max(0, currentTier.basePenalty - (monthsElapsed * 0.025));
    setActivePenalty(calculated);
  }, [currentTier, monthsElapsed]);

  const addLog = (message: string) => setTxLog((prev) => [...prev, `> ${message}`]);

  // 🛡️ TIMELAPSE ACCELERATION CONTROLS
  const advanceTime = (monthsDelta: number) => {
    setMonthsElapsed((prev) => Math.max(0, prev + monthsDelta));
  };

  const resetTime = () => {
    setMonthsElapsed(0);
  };

  // ==========================================================================
  // 🛡️ SECTOR 1 ACTIONS
  // ==========================================================================

  const handleGenesisStake = async () => {
    if (!pioneer.uid) {
      setStakeError('MESH_ERROR: Node Identity Missing.');
      return;
    }
    setIsStaking(true);
    setStakeError(null);
    setTxLog([]);
    addLog('INITIATING SOROBAN SMART CONTRACT...');
    addLog(`Target Payload: ${GENESIS_STAKE_AMOUNT} ${piText}`);

    try {
      await executeStakePayment(GENESIS_STAKE_AMOUNT);
      addLog('TRANSACTION BROADCAST SUCCESS.');
      addLog('Node Tier upgraded to [MESH_GUARDIAN].');
    } catch (err: any) {
      console.error('[MESH-SCAN] Minting Fault:', err);
      setStakeError(err.message || 'Transaction rejected by network.');
      addLog('CRITICAL: Transaction aborted.');
    } finally {
      setIsStaking(false);
    }
  };

  const executeMint = async (e: React.FormEvent) => {
    e.preventDefault();
    const piAmount = parseFloat(mintInput);
    if (isNaN(piAmount) || piAmount <= 0) return;

    try {
      const response = await fetch('/api/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderWallet: pioneer.uid,
          lockedPiAmount: piAmount,
          l1TxSignature: `pi_tx_mock_${Date.now()}`
        })
      });

      const result = await response.json();
      if (result.success) {
        setTotalMinted((prev) => prev + result.telemetry.newlyMintedMbzr);
        setCirculatingPool((prev) => prev + result.telemetry.newlyMintedMbzr);
        setMintInput('');
      } else {
        alert(`[MESH-REJECT] ${result.error || 'Transaction rejected by network firewall.'}`);
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
          sender: pioneer.uid,
          amountMbzr: mBzrAmount,
          tierBasePenalty: currentTier.basePenalty,
          monthsElapsed: monthsElapsed
        })
      });

      const result = await response.json();
      if (result.success) {
        setCirculatingPool((prev) => prev - mBzrAmount);
        setTotalMinted((prev) => prev - result.telemetry.meltBurnMbzr - result.telemetry.stakingYieldMbzr);
        setStakedReserve((prev) => prev + result.telemetry.stakingYieldMbzr);
        setRedeemInput('');
      }
    } catch (error) {
      console.error('API BRIDGE FAULT', error);
    }
  };

  // ==========================================================================
  // 🛡️ VIEWPORT RENDER
  // ==========================================================================

  if (!pioneer.isHydrated || pioneer.status === 'SYNCING') {
    return (
      <main className="max-w-[384px] mx-auto p-4 min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-mono text-center">
        <ShieldAlert className="w-8 h-8 text-amber-500 mb-4 animate-pulse" />
        <h2 className="text-amber-400 font-bold tracking-widest text-sm mb-2">ACCESS DENIED</h2>
        <p className="text-[10px] text-zinc-500 max-w-62.5">
          Node status is SYNCING. Complete the Genesis Protocol in the Academy Hub before accessing Alpha Track.
        </p>
        <Link href="/academy" className="mt-6 px-4 py-2 border border-zinc-800 rounded text-[10px] text-zinc-400 hover:text-emerald-400">
          Return to Hub
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-[384px] mx-auto p-4 pb-24 min-h-screen bg-zinc-950 text-zinc-100 font-mono selection:bg-emerald-500/30 space-y-6">
      
      {/* MODULE HEADER */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 gap-2 mt-2">
        <div>
          <h2 className="text-emerald-400 font-bold tracking-widest uppercase text-sm">ALPHA TRACK</h2>
          <p className="text-zinc-500 text-[10px] mt-0.5 flex items-center gap-1">
            <Network className="w-3 h-3 text-emerald-500" /> Bridge Online
          </p>
        </div>
        <Link href="/academy" className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 text-[10px] font-bold uppercase rounded tracking-wider transition-colors shrink-0">
          HUB
        </Link>
      </div>

      {/* DYNAMIC MATRIX */}
      {!isGuardian ? (
        <div className="space-y-4">
          <div className="p-4 bg-[#05140e] border border-emerald-500/30 rounded-lg shadow-[0_0_15px_rgba(0,210,138,0.05)]">
            <h3 className="text-emerald-300 font-bold text-xs tracking-wider uppercase flex items-center gap-2 mb-4 border-b border-zinc-800/50 pb-2">
              <Cpu className="w-4 h-4" /> Node Anchoring
            </h3>
            
            <p className="text-[10px] text-zinc-400 mb-6 leading-relaxed">
              To activate the Economic Engine, you must anchor your node. Staking <span className="text-emerald-400 font-bold">{GENESIS_STAKE_AMOUNT} {piText}</span> via Soroban permanently upgrades your tier to <span className="text-cyan-400 font-bold">MESH_GUARDIAN</span>.
            </p>

            {stakeError && (
              <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-[10px] text-red-400 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" /> <p>{stakeError}</p>
              </div>
            )}

            <button
              onClick={handleGenesisStake}
              disabled={isStaking}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:shadow-none"
            >
              {isStaking ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> EXECUTING...</>
              ) : (
                <><Zap className="w-4 h-4" /> AUTHORIZE STAKE ({GENESIS_STAKE_AMOUNT} {piText})</>
              )}
            </button>
          </div>

          {txLog.length > 0 && (
            <div className="p-3 bg-black border border-zinc-800 rounded-lg font-mono text-[9px] text-emerald-500/80 space-y-1 mt-4 max-h-37.5 overflow-y-auto">
              {txLog.map((log, i) => (
                <div key={i} className="animate-in slide-in-from-bottom-2 fade-in duration-200">{log}</div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          
          <div className="p-3 bg-cyan-950/20 border border-cyan-900/50 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Node Anchored</p>
              <p className="text-[9px] text-cyan-600">Economic Engine Unlocked.</p>
            </div>
          </div>

          {/* PROTOCOL RESERVE TELEMETRY */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-sm space-y-3 shadow-inner">
            <h3 className="text-xs text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Liquidity Matrix
            </h3>
            <div className="flex justify-between">
              <span className="text-zinc-500 text-xs">Total Minted (mBZR):</span>
              <span className="font-bold text-amber-400 text-xs">{totalMinted.toFixed(2)} mBZR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 text-xs">Vault Collateral ({piText}):</span>
              <span className="font-bold text-blue-400 text-xs">{currentVaultCollateralPi.toFixed(4)} {piSymbol}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-2 mt-2">
              <span className="text-zinc-500 text-xs">Circulating Pool:</span>
              <span className="font-bold text-emerald-300 text-xs">{circulatingPool.toFixed(2)} mBZR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 text-xs">Staked Reserve:</span>
              <span className="font-bold text-purple-400 text-xs">{stakedReserve.toFixed(2)} mBZR</span>
            </div>
          </div>

          {/* MINT PROTOCOL & SIMULATION PRESETS */}
          <div className="bg-[#05140e] border border-emerald-900/50 p-4 rounded-lg space-y-3">
            <h4 className="text-[10px] text-emerald-500 uppercase tracking-widest">Genesis Mint & Security Test</h4>
            
            {/* SIMULATION PRESETS */}
            <div className="p-2 bg-zinc-950/60 border border-emerald-900/30 rounded space-y-1.5">
              <div className="flex justify-between items-center text-[9px] text-zinc-400">
                <span className="uppercase font-bold">Shield Simulation Presets:</span>
                <span className="text-emerald-400">TEST GATE</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setMintInput("100")}
                  className="py-1 px-1 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 rounded text-[9px] text-emerald-300 font-mono transition-colors text-center"
                >
                  100 {piText} <span className="block text-[7px] text-emerald-500/70">Normal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMintInput("1000")}
                  className="py-1 px-1 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/50 rounded text-[9px] text-amber-300 font-mono transition-colors text-center"
                >
                  1000 {piText} <span className="block text-[7px] text-amber-500/70">Max Cap</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMintInput("1001")}
                  className="py-1 px-1 bg-red-950/40 hover:bg-red-900/50 border border-red-800/50 rounded text-[9px] text-red-300 font-mono transition-colors text-center"
                >
                  1001 {piText} <span className="block text-[7px] text-red-500/70">Overflow</span>
                </button>
              </div>
            </div>

            <form onSubmit={executeMint} className="space-y-3">
              <input 
                type="number" 
                step="any"
                value={mintInput} 
                onChange={(e) => setMintInput(e.target.value)} 
                placeholder={`Amount ${piText} (Max 1000)`}
                className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded text-emerald-300 focus:outline-none focus:border-emerald-500 transition-colors text-xs font-mono"
              />
              <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-[10px] font-bold uppercase tracking-wider rounded transition-colors shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                Execute Mint
              </button>
            </form>
          </div>

          {/* 🛡️ TIMELAPSE SIMULATION CONSOLE */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h4 className="text-[10px] text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                <Clock className="w-3.5 h-3.5" /> Timelapse Simulator
              </h4>
              <button 
                onClick={resetTime}
                className="text-[9px] text-zinc-500 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                title="Reset Elapsed Time to Zero"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Time Elapsed:</span>
              <span className="font-bold text-cyan-300">
                {monthsElapsed.toFixed(1)} Months (~{(monthsElapsed / 12).toFixed(2)} Years)
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => advanceTime(0.033)}
                className="py-1.5 bg-zinc-950 hover:bg-cyan-950/40 border border-zinc-800 hover:border-cyan-800 rounded text-[9px] text-cyan-400 font-mono transition-colors text-center"
              >
                +1 Day
              </button>
              <button
                type="button"
                onClick={() => advanceTime(0.25)}
                className="py-1.5 bg-zinc-950 hover:bg-cyan-950/40 border border-zinc-800 hover:border-cyan-800 rounded text-[9px] text-cyan-400 font-mono transition-colors text-center"
              >
                +1 Week
              </button>
              <button
                type="button"
                onClick={() => advanceTime(1)}
                className="py-1.5 bg-zinc-950 hover:bg-cyan-950/40 border border-zinc-800 hover:border-cyan-800 rounded text-[9px] text-cyan-400 font-mono transition-colors text-center"
              >
                +1 Month
              </button>
              <button
                type="button"
                onClick={() => advanceTime(12)}
                className="py-1.5 bg-zinc-950 hover:bg-cyan-950/40 border border-zinc-800 hover:border-cyan-800 rounded text-[9px] text-cyan-400 font-mono transition-colors text-center"
              >
                +1 Year
              </button>
            </div>
          </div>

          {/* EARLY REDEMPTION PROTOCOL */}
          <div className="bg-red-950/10 border border-red-900/30 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-end">
              <h4 className="text-[10px] text-red-500 uppercase tracking-widest">Early Redemption</h4>
              <span className="text-[9px] text-red-400 font-bold">Yield Penalty: {(activePenalty * 100).toFixed(1)}%</span>
            </div>
            <p className="text-[9px] text-zinc-500 leading-tight">
              *Note: Principal {piText} collateral is <span className="text-zinc-300 font-bold">100% protected</span>. Penalties apply exclusively to early accumulated dividend yields and decay over elapsed simulation time.
            </p>
            <form onSubmit={executeRedeem} className="space-y-3">
              <input 
                type="number" 
                step="any"
                value={redeemInput} 
                onChange={(e) => setRedeemInput(e.target.value)} 
                placeholder="Amount mBZR"
                className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded text-red-300 focus:outline-none focus:border-red-500 transition-colors text-xs font-mono"
              />
              <button type="submit" className="w-full py-3 bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700/50 text-[10px] font-bold uppercase tracking-wider rounded transition-colors">
                Execute Redeem
              </button>
            </form>
          </div>

        </div>
      )}
    </main>
  );
}