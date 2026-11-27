'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Repeat,
  ArrowUpDown,
  Settings,
  Coins,
  RefreshCw,
  Lock,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  PieChart,
  Sparkles,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import {
  BPS_DENOMINATOR,
  computeMeltExit,
  computeSwapAndFeeSplit,
  format7Decimals,
  parseDecimalTo7Decimals,
  SWAP_FEE_BPS,
  SwapDirection,
} from '@/app/lib/economics/liquidityPoolMath';

interface PoolSnapshot {
  poolId: string;
  status: 'ACTIVE' | 'PAUSED' | 'CAP_REACHED';
  totalStakedPiStroops: string;
  totalStakedPiFormatted: string;
  remainingGlobalCapPiStroops: string;
  remainingGlobalCapPiFormatted: string;
  activeMbzrIssuedSubunits: string;
  activeMbzrIssuedFormatted: string;
  polReservePiFormatted: string;
  polReserveMbzrFormatted: string;
  collateralRatioBps: string;
  collateralRatioPct: string;
  currentEpochNumber: number;
}

interface SwapApiResponse {
  success: boolean;
  error?: string;
  swapTxHash?: string;
  direction?: SwapDirection;
  grossInputUnits?: string;
  grossInputFormatted?: string;
  feeInputUnits?: string;
  netInputUnits?: string;
  netOutputUnits?: string;
  netOutputFormatted?: string;
  feeSplit?: {
    feeMbzrSubunits: string;
    stakerShare70MbzrSubunits: string;
    polShare30MbzrSubunits: string;
  };
  feeAccrual?: {
    recorded: boolean;
    duplicate: boolean;
    epochNumber: number;
    addedMbzrSubunits: string;
  };
}

export default function MeshSwapPage() {
  // Network Environment State
  const [network, setNetwork] = useState<'TESTNET' | 'MAINNET'>('TESTNET');

  // Dynamic Token Symbols & Styling
  const isTestnet = network === 'TESTNET';
  const piSymbol = isTestnet ? 'TEST_PI' : 'PI';
  const mbzrSymbol = isTestnet ? 'TEST_mBZR' : 'mBZR';

  // Live Pool Telemetry from GET /api/staking/pool
  const [poolSnapshot, setPoolSnapshot] = useState<PoolSnapshot | null>(null);
  const [isLoadingPool, setIsLoadingPool] = useState<boolean>(true);

  // Swap State
  const [payAmount, setPayAmount] = useState<string>('10');
  const [swapDirection, setSwapDirection] = useState<SwapDirection>('PI_TO_MBZR');
  const [slippageBps, setSlippageBps] = useState<bigint>(50n); // 0.50% default tolerance
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Execution & Feedback State
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [txSuccess, setTxSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string>('');
  const [lastEpochRecorded, setLastEpochRecorded] = useState<number | null>(null);

  // User Balances in 7-decimal BigInt stroops / mBZR subunits
  const [userBalances, setUserBalances] = useState<{
    piStroops: bigint;
    mbzrSubunits: bigint;
  }>({
    piStroops: 1_425_000_000n,      // 142.5000000 Pi
    mbzrSubunits: 250_000_000_000n, // 25,000.0000000 mBZR
  });

  const fetchPoolSnapshot = useCallback(async () => {
    setIsLoadingPool(true);
    try {
      const res = await fetch('/api/staking/pool', { cache: 'no-store' });
      const data = await res.json();
      if (data?.success && data?.pool) {
        setPoolSnapshot(data.pool as PoolSnapshot);
      }
    } catch (err) {
      console.error('[MeshSwapPage] Failed to load pool snapshot:', err);
    } finally {
      setIsLoadingPool(false);
    }
  }, []);

  useEffect(() => {
    fetchPoolSnapshot();
  }, [fetchPoolSnapshot]);

  // Dynamic Font Sizer to prevent mobile UI overlaps
  const getFontSizeClass = (valStr: string) => {
    if (valStr.length > 14) return 'text-xs sm:text-sm';
    if (valStr.length > 10) return 'text-sm sm:text-base';
    if (valStr.length > 6) return 'text-base sm:text-xl';
    return 'text-xl sm:text-2xl';
  };

  // Parse decimal input safely to 7-decimal BigInt stroops/subunits
  const parsedInput = useMemo(() => {
    const trimmed = payAmount.trim();
    if (!trimmed) {
      return { units: 0n, invalid: false };
    }
    try {
      const units = parseDecimalTo7Decimals(trimmed);
      if (units < 0n) return { units: 0n, invalid: true };
      return { units, invalid: false };
    } catch {
      return { units: 0n, invalid: true };
    }
  }, [payAmount]);

  const grossInputUnits = parsedInput.units;
  const activeBalanceUnits =
    swapDirection === 'PI_TO_MBZR' ? userBalances.piStroops : userBalances.mbzrSubunits;
  const exceedsBalance = grossInputUnits > activeBalanceUnits;

  // Exact BigInt swap & 70/30 fee split calculation from liquidityPoolMath.ts
  const swapQuote = useMemo(() => {
    return computeSwapAndFeeSplit(grossInputUnits, swapDirection, 0n, SWAP_FEE_BPS);
  }, [grossInputUnits, swapDirection]);

  // L1 Melt Exit preview when converting mBZR -> Pi (0.50% L1 exit tariff)
  const meltPreview = useMemo(() => {
    if (swapDirection !== 'MBZR_TO_PI' || grossInputUnits <= 0n) return null;
    return computeMeltExit(grossInputUnits);
  }, [swapDirection, grossInputUnits]);

  const minimumReceivedUnits = useMemo(() => {
    if (swapQuote.netOutputUnits <= 0n) return 0n;
    return (swapQuote.netOutputUnits * (BPS_DENOMINATOR - slippageBps)) / BPS_DENOMINATOR;
  }, [swapQuote.netOutputUnits, slippageBps]);

  const formattedReceive = format7Decimals(swapQuote.netOutputUnits);
  const collateralRatioBps = poolSnapshot ? BigInt(poolSnapshot.collateralRatioBps || '10000') : 10_000n;
  const isCollateralHealthy = collateralRatioBps >= BPS_DENOMINATOR;
  const isPoolPaused = poolSnapshot?.status === 'PAUSED';

  // Handle Token Direction Switch
  const handleSwitchDirection = () => {
    setSwapDirection((prev) => (prev === 'PI_TO_MBZR' ? 'MBZR_TO_PI' : 'PI_TO_MBZR'));
    setPayAmount(swapDirection === 'PI_TO_MBZR' ? '1000' : '10');
    setErrorMsg(null);
    setTxSuccess(false);
  };

  // Execute Swap via POST /api/swap (persists 0.30% fee into EpochRewardLedger)
  const handleExecuteSwap = async () => {
    if (isSwapping || parsedInput.invalid || grossInputUnits <= 0n) return;

    if (isPoolPaused) {
      setErrorMsg('Liquidity pool is currently PAUSED.');
      return;
    }

    if (swapDirection === 'PI_TO_MBZR' && !isCollateralHealthy) {
      setErrorMsg('Collateralization ratio below 1.00x circuit breaker; mint swaps temporarily halted.');
      return;
    }

    if (exceedsBalance) {
      setErrorMsg(
        `Insufficient ${swapDirection === 'PI_TO_MBZR' ? piSymbol : mbzrSymbol} balance.`
      );
      return;
    }

    setIsSwapping(true);
    setTxSuccess(false);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction: swapDirection,
          amountUnits: grossInputUnits.toString(),
          pioneerUid: `mesh_swap_${network.toLowerCase()}`,
        }),
      });

      const data = (await response.json()) as SwapApiResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Swap execution failed.');
      }

      const netOut = BigInt(data.netOutputUnits || swapQuote.netOutputUnits.toString());

      if (swapDirection === 'PI_TO_MBZR') {
        setUserBalances((prev) => ({
          piStroops: prev.piStroops >= grossInputUnits ? prev.piStroops - grossInputUnits : 0n,
          mbzrSubunits: prev.mbzrSubunits + netOut,
        }));
      } else {
        setUserBalances((prev) => ({
          mbzrSubunits:
            prev.mbzrSubunits >= grossInputUnits ? prev.mbzrSubunits - grossInputUnits : 0n,
          piStroops: prev.piStroops + netOut,
        }));
      }

      setLastTxHash(data.swapTxHash || '');
      setLastEpochRecorded(data.feeAccrual?.epochNumber ?? poolSnapshot?.currentEpochNumber ?? 1);
      setTxSuccess(true);
      setPayAmount('0');
      await fetchPoolSnapshot();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Swap execution failed.');
    } finally {
      setIsSwapping(false);
    }
  };

  const slippagePctDisplay = (Number(slippageBps) / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-3 sm:p-6 font-sans pb-28 overflow-x-hidden">
      <div className="max-w-md mx-auto space-y-4 w-full">
        {/* TOP NAVIGATION / HEADER */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/mesh"
            className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft size={16} /> Hub
          </Link>

          <div className="flex items-center space-x-2">
            {/* NETWORK TOGGLE PILL */}
            <div className="flex items-center p-0.5 bg-neutral-900 border border-neutral-800 rounded-xl font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setNetwork('TESTNET')}
                className={`px-2 py-1 rounded-lg transition-all font-bold ${
                  isTestnet
                    ? 'bg-amber-950 text-amber-400 border border-amber-800/80 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                TESTNET
              </button>
              <button
                type="button"
                onClick={() => setNetwork('MAINNET')}
                className={`px-2 py-1 rounded-lg transition-all font-bold ${
                  !isTestnet
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                MAINNET
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              aria-label="Toggle Swap Settings"
              className={`p-2 rounded-xl border transition ${
                showSettings
                  ? 'bg-cyan-950 border-cyan-700 text-cyan-400'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* SLIPPAGE & ENVIRONMENT SETTINGS */}
        {showSettings && (
          <div className="bg-neutral-900/90 border border-neutral-800 p-3.5 rounded-2xl space-y-3 font-mono text-xs animate-in fade-in">
            <div className="flex justify-between items-center text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Globe size={14} className="text-cyan-400" /> Active Network
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  isTestnet
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}
              >
                {network}
              </span>
            </div>

            <div className="flex justify-between items-center text-neutral-400 border-t border-neutral-800/80 pt-2">
              <span>Min. Received Tolerance</span>
              <span className="text-cyan-400 font-bold">{slippagePctDisplay}%</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '0.1%', bps: 10n },
                { label: '0.5%', bps: 50n },
                { label: '1.0%', bps: 100n },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.label}
                  onClick={() => setSlippageBps(opt.bps)}
                  className={`py-1.5 rounded-lg border text-center transition ${
                    slippageBps === opt.bps
                      ? 'bg-cyan-950 border-cyan-600 text-cyan-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  max="50"
                  aria-label="Custom Slippage Percent"
                  placeholder="Custom"
                  value={Number(slippageBps) / 100}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    if (Number.isFinite(parsed) && parsed > 0) {
                      const clamped = Math.min(5000, Math.max(1, Math.round(parsed * 100)));
                      setSlippageBps(BigInt(clamped));
                    } else {
                      setSlippageBps(50n);
                    }
                  }}
                  className="w-full h-full bg-neutral-950 border border-neutral-800 rounded-lg text-center px-1 text-cyan-300 focus:outline-none focus:border-cyan-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* COLLATERAL CIRCUIT BREAKER BANNER */}
        {poolSnapshot && !isCollateralHealthy && (
          <div className="bg-amber-950/70 border border-amber-800 p-3 rounded-2xl flex items-start gap-2 font-mono text-[11px] text-amber-300">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
            <div>
              Collateral Ratio at {poolSnapshot.collateralRatioPct}% (below 100.00% floor).
              New {piSymbol} to {mbzrSymbol} mint swaps are paused while {mbzrSymbol} redemptions remain open.
            </div>
          </div>
        )}

        {/* SWAP CARD CONTAINER */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-3 relative">
          <div className="flex justify-between items-center px-1">
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <Repeat size={18} className="text-cyan-400" /> MESH Peg Swap
            </h1>
            <span
              className={`text-[10px] font-mono border px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                isTestnet
                  ? 'bg-amber-950 text-amber-400 border-amber-800/80'
                  : 'bg-emerald-950 text-emerald-400 border-emerald-800/80'
              }`}
            >
              <Sparkles size={10} /> 1 {piSymbol} = 1,000 {mbzrSymbol}
            </span>
          </div>

          {/* INPUT 1: YOU PAY */}
          <div className="bg-neutral-950 border border-neutral-800/80 p-3.5 rounded-2xl space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>You Pay</span>
              <button
                type="button"
                onClick={() => setPayAmount(format7Decimals(activeBalanceUnits))}
                className={`hover:underline ${exceedsBalance ? 'text-rose-400 font-bold' : ''}`}
              >
                Balance: {format7Decimals(activeBalanceUnits)}
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  inputMode="decimal"
                  value={payAmount}
                  onChange={(e) => {
                    setPayAmount(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="0.0000000"
                  className={`w-full bg-transparent font-bold font-mono text-white focus:outline-none truncate ${getFontSizeClass(payAmount)}`}
                />
              </div>
              <button
                type="button"
                onClick={handleSwitchDirection}
                className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-white flex items-center gap-2 shrink-0"
              >
                <Coins
                  size={14}
                  className={
                    swapDirection === 'PI_TO_MBZR'
                      ? isTestnet
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                      : 'text-cyan-400'
                  }
                />
                {swapDirection === 'PI_TO_MBZR' ? piSymbol : mbzrSymbol}
              </button>
            </div>
          </div>

          {/* DIRECTION INDICATOR & SWAP SWITCH */}
          <div className="flex items-center justify-between px-2 -my-1.5 relative z-10 font-mono text-[11px]">
            <span className="px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300">
              Direction:{' '}
              <strong className="text-cyan-400">
                {swapDirection === 'PI_TO_MBZR'
                  ? `${piSymbol} -> ${mbzrSymbol}`
                  : `${mbzrSymbol} -> ${piSymbol}`}
              </strong>
            </span>

            <button
              type="button"
              onClick={handleSwitchDirection}
              aria-label="Switch Swap Direction"
              title="Switch swap direction"
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-500 text-cyan-400 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5 font-bold"
            >
              <ArrowUpDown size={14} />
              <span>Switch</span>
            </button>
          </div>

          {/* INPUT 2: YOU RECEIVE */}
          <div className="bg-neutral-950 border border-neutral-800/80 p-3.5 rounded-2xl space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>You Receive (Exact 7-Dec)</span>
              <span>
                Balance:{' '}
                {swapDirection === 'PI_TO_MBZR'
                  ? format7Decimals(userBalances.mbzrSubunits)
                  : format7Decimals(userBalances.piStroops)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  readOnly
                  value={formattedReceive}
                  className={`w-full bg-transparent font-bold font-mono text-cyan-300 focus:outline-none truncate ${getFontSizeClass(formattedReceive)}`}
                />
              </div>
              <button
                type="button"
                onClick={handleSwitchDirection}
                className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-white flex items-center gap-2 shrink-0"
              >
                <Coins
                  size={14}
                  className={
                    swapDirection === 'PI_TO_MBZR'
                      ? 'text-cyan-400'
                      : isTestnet
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                  }
                />
                {swapDirection === 'PI_TO_MBZR' ? mbzrSymbol : piSymbol}
              </button>
            </div>
          </div>

          {/* ROUTE & EXACT BIG-INT FEE BREAKDOWN */}
          <div className="bg-neutral-950/50 border border-neutral-800/60 p-3 rounded-xl space-y-1.5 font-mono text-[11px] text-neutral-400">
            <div className="flex justify-between">
              <span>Fixed Utility Peg</span>
              <span className="text-neutral-200">
                {swapDirection === 'PI_TO_MBZR'
                  ? `1 ${piSymbol} = 1,000 ${mbzrSymbol}`
                  : `1,000 ${mbzrSymbol} = 1 ${piSymbol}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Net Converted Input</span>
              <span className="text-neutral-200">
                {format7Decimals(swapQuote.netInputUnits)}{' '}
                {swapDirection === 'PI_TO_MBZR' ? piSymbol : mbzrSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Min. Received ({slippagePctDisplay}%)</span>
              <span className="text-neutral-200">
                {format7Decimals(minimumReceivedUnits)}{' '}
                {swapDirection === 'PI_TO_MBZR' ? mbzrSymbol : piSymbol}
              </span>
            </div>

            {meltPreview && (
              <div className="flex justify-between text-[10px] text-amber-300/90 pt-1 border-t border-neutral-800/60">
                <span>L1 Melt Exit Reference (0.50% Tariff)</span>
                <span>{format7Decimals(meltPreview.netPiStroops)} {piSymbol}</span>
              </div>
            )}

            {/* 0.30% PROTOCOL FEE SPLIT BREAKDOWN */}
            <div className="pt-1.5 border-t border-neutral-800/80 space-y-1">
              <div className="flex justify-between items-center text-cyan-400 font-bold">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} /> Protocol Swap Fee (0.30%)
                </span>
                <span>
                  {format7Decimals(swapQuote.feeMbzrSubunits)} {mbzrSymbol}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-neutral-500 pl-3">
                <span>├ 70% Staker / Node Yield</span>
                <span className="text-emerald-400">
                  +{format7Decimals(swapQuote.stakerShareMbzrSubunits)} {mbzrSymbol}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-neutral-500 pl-3">
                <span>└ 30% Treasury POL Buffer</span>
                <span className="text-indigo-400">
                  +{format7Decimals(swapQuote.polShareMbzrSubunits)} {mbzrSymbol}
                </span>
              </div>
            </div>
          </div>

          {parsedInput.invalid && (
            <div className="bg-rose-950/70 border border-rose-800 p-2.5 rounded-xl font-mono text-[11px] text-rose-300">
              Enter a valid positive decimal amount (up to 7 decimal places).
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-950/70 border border-rose-800 p-2.5 rounded-xl font-mono text-[11px] text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* SWAP ACTION BUTTON */}
          <button
            type="button"
            onClick={handleExecuteSwap}
            disabled={
              isSwapping ||
              parsedInput.invalid ||
              grossInputUnits <= 0n ||
              exceedsBalance ||
              isPoolPaused ||
              (swapDirection === 'PI_TO_MBZR' && !isCollateralHealthy)
            }
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
              isSwapping
                ? 'bg-cyan-950 border border-cyan-800 text-cyan-400 cursor-wait'
                : parsedInput.invalid ||
                    grossInputUnits <= 0n ||
                    exceedsBalance ||
                    isPoolPaused ||
                    (swapDirection === 'PI_TO_MBZR' && !isCollateralHealthy)
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-linear-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-950/50'
            }`}
          >
            {isSwapping ? (
              <>
                <RefreshCw size={16} className="animate-spin text-cyan-400" />
                Settling Epoch Fee & Swap...
              </>
            ) : exceedsBalance ? (
              <span>Insufficient Balance</span>
            ) : (
              <>
                <Lock size={16} />
                Execute L2 Swap ({network})
              </>
            )}
          </button>
        </div>

        {/* SUCCESS TRANSACTION BANNER */}
        {txSuccess && (
          <div className="bg-emerald-950/60 border border-emerald-800 p-3.5 rounded-2xl space-y-1 font-mono text-xs animate-in fade-in wrap-break-word">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 size={16} /> Swap Confirmed on MESH L2 ({network})!
            </div>
            <div className="text-[10px] text-neutral-400 break-all">
              Tx Hash: <span className="text-emerald-300">{lastTxHash}</span>
            </div>
            {lastEpochRecorded !== null && (
              <div className="text-[10px] text-emerald-300/90">
                0.30% Fee Recorded to Epoch #{lastEpochRecorded} (70% Stakers / 30% POL)
              </div>
            )}
          </div>
        )}

        {/* LIVE POOL & RESERVE ANALYTICS */}
        <div className="bg-neutral-900/50 border border-neutral-800/80 p-3.5 rounded-2xl space-y-2.5 font-mono text-xs">
          <div className="flex justify-between items-center text-neutral-400 pb-1 border-b border-neutral-800">
            <span className="font-bold text-neutral-300 flex items-center gap-1.5">
              <PieChart size={14} className="text-cyan-400" /> Genesis 1,000 Pi Pool Reserves
            </span>
            <button
              type="button"
              onClick={fetchPoolSnapshot}
              disabled={isLoadingPool}
              className={`text-[10px] font-bold flex items-center gap-1 ${
                isTestnet ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              <RefreshCw size={11} className={isLoadingPool ? 'animate-spin' : ''} />
              {poolSnapshot ? `CR ${poolSnapshot.collateralRatioPct}%` : 'Loading...'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-neutral-500 block text-[9px]">
                Staked Vault ({piSymbol})
              </span>
              <span
                className={`font-bold ${
                  isTestnet ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {poolSnapshot ? poolSnapshot.totalStakedPiFormatted : '0.0000000'} {piSymbol}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[9px]">
                Active L2 Backing ({mbzrSymbol})
              </span>
              <span className="font-bold text-cyan-400">
                {poolSnapshot ? poolSnapshot.activeMbzrIssuedFormatted : '0.0000000'} {mbzrSymbol}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[9px]">
                Remaining 1,000 Pi Cap
              </span>
              <span className="font-bold text-neutral-200">
                {poolSnapshot ? poolSnapshot.remainingGlobalCapPiFormatted : '1000.0000000'} {piSymbol}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[9px]">
                Settled POL Reserve
              </span>
              <span className="font-bold text-indigo-400">
                {poolSnapshot ? poolSnapshot.polReserveMbzrFormatted : '0.0000000'} {mbzrSymbol}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}