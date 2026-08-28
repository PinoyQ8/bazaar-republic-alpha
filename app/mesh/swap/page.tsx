'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Repeat, 
  ArrowDown, 
  Settings, 
  Coins, 
  RefreshCw, 
  Lock, 
  ShieldCheck, 
  ArrowLeft,
  CheckCircle2,
  PieChart,
  Sparkles,
  Globe
} from 'lucide-react';

export default function MeshSwapPage() {
  // Network Environment State
  const [network, setNetwork] = useState<'TESTNET' | 'MAINNET'>('TESTNET');

  // Dynamic Token Symbols & Styling
  const isTestnet = network === 'TESTNET';
  const piSymbol = isTestnet ? 'TEST_PI' : 'PI';
  const mbzrSymbol = isTestnet ? 'TEST_mBZR' : 'mBZR';

  // Pool Reserves: Anchored to 1 PI = 1,000 mBZR Peg Baseline (x * y = k)
  const [piReserve, setPiReserve] = useState<number>(100000); // 100k PI
  const [mbzrReserve, setMbzrReserve] = useState<number>(100000000); // 100M mBZR

  // Swap State
  const [payAmount, setPayAmount] = useState<string>('10');
  const [swapDirection, setSwapDirection] = useState<'PI_TO_MBZR' | 'MBZR_TO_PI'>('PI_TO_MBZR');
  const [slippage, setSlippage] = useState<number>(0.5); // 0.5%
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Execution State
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [txSuccess, setTxSuccess] = useState<boolean>(false);
  const [lastTxHash, setLastTxHash] = useState<string>('');

  // User Balances
  const [userBalances, setUserBalances] = useState({
    pi: 142.50,
    mbzr: 25000.00
  });

  // Dynamic Font Sizer to prevent mobile UI overlaps
  const getFontSizeClass = (valStr: string) => {
    if (valStr.length > 14) return 'text-xs sm:text-sm';
    if (valStr.length > 10) return 'text-sm sm:text-base';
    if (valStr.length > 6) return 'text-base sm:text-xl';
    return 'text-xl sm:text-2xl';
  };

  // Calculate AMM Output using x * y = k (0.3% Fee)
  const calculateOutput = (inputVal: number, inputReserve: number, outputReserve: number) => {
    if (!inputVal || inputVal <= 0) return 0;
    const inputWithFee = inputVal * 0.997; // Deducts 0.3% protocol fee
    const numerator = inputWithFee * outputReserve;
    const denominator = inputReserve + inputWithFee;
    return numerator / denominator;
  };

  const payNum = parseFloat(payAmount) || 0;
  
  const receiveAmount = swapDirection === 'PI_TO_MBZR'
    ? calculateOutput(payNum, piReserve, mbzrReserve)
    : calculateOutput(payNum, mbzrReserve, piReserve);

  const formattedReceive = receiveAmount 
    ? (receiveAmount > 100000 ? receiveAmount.toFixed(2) : receiveAmount.toFixed(4)) 
    : '0.00';

  // Fee Calculations (0.3% Fee Split -> 70% Node Yield / 30% Treasury POL)
  const totalFee = payNum * 0.003;
  const nodeYieldShare = totalFee * 0.70;
  const treasuryPolShare = totalFee * 0.30;

  // Calculate Spot Price & Price Impact
  const spotPrice = swapDirection === 'PI_TO_MBZR'
    ? mbzrReserve / piReserve
    : piReserve / mbzrReserve;

  const executionPrice = payNum > 0 ? receiveAmount / payNum : spotPrice;
  const priceImpact = payNum > 0 ? Math.max(0, ((spotPrice - executionPrice) / spotPrice) * 100) : 0;
  const minimumReceived = receiveAmount * (1 - slippage / 100);

  // Handle Token Direction Switch
  const handleSwitchDirection = () => {
    setSwapDirection((prev) => (prev === 'PI_TO_MBZR' ? 'MBZR_TO_PI' : 'PI_TO_MBZR'));
    setPayAmount('10');
  };

  // Simulate Passkey Handshake & AMM Swap Execution
  const handleExecuteSwap = async () => {
    if (payNum <= 0) return;

    setIsSwapping(true);
    setTxSuccess(false);

    try {
      // 1. Simulate Passkey Hardware Signing Delay
      await new Promise((resolve) => setTimeout(resolve, 1800));

      // 2. Update Pool Reserves & User Balances
      if (swapDirection === 'PI_TO_MBZR') {
        setPiReserve((prev) => prev + payNum);
        setMbzrReserve((prev) => prev - receiveAmount);
        setUserBalances((prev) => ({
          pi: prev.pi - payNum,
          mbzr: prev.mbzr + receiveAmount
        }));
      } else {
        setMbzrReserve((prev) => prev + payNum);
        setPiReserve((prev) => prev - receiveAmount);
        setUserBalances((prev) => ({
          mbzr: prev.mbzr - payNum,
          pi: prev.pi + receiveAmount
        }));
      }

      const mockHash = '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setLastTxHash(mockHash);
      setTxSuccess(true);
      setPayAmount('0');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSwapping(false);
    }
  };

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
              <span className="flex items-center gap-1.5"><Globe size={14} className="text-cyan-400" /> Active Network</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                isTestnet ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}>
                {network}
              </span>
            </div>

            <div className="flex justify-between items-center text-neutral-400 border-t border-neutral-800/80 pt-2">
              <span>Slippage Tolerance</span>
              <span className="text-cyan-400 font-bold">{slippage}%</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[0.1, 0.5, 1.0].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`py-1.5 rounded-lg border text-center transition ${
                    slippage === val
                      ? 'bg-cyan-950 border-cyan-600 text-cyan-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  {val}%
                </button>
              ))}
              <div className="relative">
                <input
                  type="number"
                  placeholder="Custom"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                  className="w-full h-full bg-neutral-950 border border-neutral-800 rounded-lg text-center px-1 text-cyan-300 focus:outline-none focus:border-cyan-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* SWAP CARD CONTAINER */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-3 relative">
          
          <div className="flex justify-between items-center px-1">
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <Repeat size={18} className="text-cyan-400" /> AMM Swap Engine
            </h1>
            <span className={`text-[10px] font-mono border px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
              isTestnet ? 'bg-amber-950 text-amber-400 border-amber-800/80' : 'bg-emerald-950 text-emerald-400 border-emerald-800/80'
            }`}>
              <Sparkles size={10} /> 1 {piSymbol} = 1,000 {mbzrSymbol}
            </span>
          </div>

          {/* INPUT 1: YOU PAY */}
          <div className="bg-neutral-950 border border-neutral-800/80 p-3.5 rounded-2xl space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>You Pay</span>
              <span>
                Balance: {swapDirection === 'PI_TO_MBZR' ? userBalances.pi.toFixed(2) : userBalances.mbzr.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.0"
                  className={`w-full bg-transparent font-bold font-mono text-white focus:outline-none truncate ${getFontSizeClass(payAmount)}`}
                />
              </div>
              <button 
                type="button" 
                className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-white flex items-center gap-2 shrink-0"
              >
                <Coins size={14} className={swapDirection === 'PI_TO_MBZR' ? (isTestnet ? 'text-amber-400' : 'text-emerald-400') : 'text-cyan-400'} />
                {swapDirection === 'PI_TO_MBZR' ? piSymbol : mbzrSymbol}
              </button>
            </div>
          </div>

          {/* DIRECTION SWITCH BUTTON */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleSwitchDirection}
              className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-500 text-cyan-400 rounded-2xl shadow-xl transition-all active:scale-95"
            >
              <ArrowDown size={18} />
            </button>
          </div>

          {/* INPUT 2: YOU RECEIVE */}
          <div className="bg-neutral-950 border border-neutral-800/80 p-3.5 rounded-2xl space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>You Receive (Estimated)</span>
              <span>
                Balance: {swapDirection === 'PI_TO_MBZR' ? userBalances.mbzr.toFixed(2) : userBalances.pi.toFixed(2)}
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
                className="bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-white flex items-center gap-2 shrink-0"
              >
                <Coins size={14} className={swapDirection === 'PI_TO_MBZR' ? 'text-cyan-400' : (isTestnet ? 'text-amber-400' : 'text-emerald-400')} />
                {swapDirection === 'PI_TO_MBZR' ? mbzrSymbol : piSymbol}
              </button>
            </div>
          </div>

          {/* ROUTE & IMPACT SUMMARY */}
          <div className="bg-neutral-950/50 border border-neutral-800/60 p-3 rounded-xl space-y-1.5 font-mono text-[11px] text-neutral-400">
            <div className="flex justify-between">
              <span>Peg Exchange Rate</span>
              <span className="text-neutral-200">
                1 {swapDirection === 'PI_TO_MBZR' ? piSymbol : mbzrSymbol} ≈ {spotPrice.toFixed(2)} {swapDirection === 'PI_TO_MBZR' ? mbzrSymbol : piSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Price Impact</span>
              <span className={priceImpact > 2 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {priceImpact < 0.01 ? '<0.01%' : `${priceImpact.toFixed(2)}%`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Min. Received ({slippage}%)</span>
              <span className="text-neutral-200">{minimumReceived.toFixed(4)}</span>
            </div>

            {/* 0.3% PROTOCOL FEE SPLIT BREAKDOWN */}
            <div className="pt-1.5 border-t border-neutral-800/80 space-y-1">
              <div className="flex justify-between items-center text-cyan-400 font-bold">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} /> Protocol Swap Fee (0.3%)
                </span>
                <span>{totalFee.toFixed(4)} {swapDirection === 'PI_TO_MBZR' ? piSymbol : mbzrSymbol}</span>
              </div>
              <div className="flex justify-between text-[10px] text-neutral-500 pl-3">
                <span className="flex items-center gap-1">├ 70% Node Yield Matrix</span>
                <span className="text-emerald-400">+{nodeYieldShare.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-neutral-500 pl-3">
                <span className="flex items-center gap-1">└ 30% Treasury POL Buffer</span>
                <span className="text-indigo-400">+{treasuryPolShare.toFixed(4)}</span>
              </div>
            </div>
          </div>

          {/* SWAP ACTION BUTTON */}
          <button
            type="button"
            onClick={handleExecuteSwap}
            disabled={isSwapping || payNum <= 0}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
              isSwapping
                ? 'bg-cyan-950 border border-cyan-800 text-cyan-400 cursor-wait'
                : payNum <= 0
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-linear-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-950/50'
            }`}
          >
            {isSwapping ? (
              <>
                <RefreshCw size={16} className="animate-spin text-cyan-400" />
                Prompting Knox Biometrics...
              </>
            ) : (
              <>
                <Lock size={16} />
                Execute Passkey Swap ({network})
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
          </div>
        )}

        {/* LIQUIDITY POOL ANALYTICS */}
        <div className="bg-neutral-900/50 border border-neutral-800/80 p-3.5 rounded-2xl space-y-2 font-mono text-xs">
          <div className="flex justify-between items-center text-neutral-400 pb-1 border-b border-neutral-800">
            <span className="font-bold text-neutral-300 flex items-center gap-1.5">
              <PieChart size={14} className="text-cyan-400" /> Anchored Liquidity Depth
            </span>
            <span className={`text-[10px] font-bold ${isTestnet ? 'text-amber-400' : 'text-emerald-400'}`}>
              1:1000 Peg ({network})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-neutral-500 block text-[9px]">{piSymbol} Reserve (L1 Vault)</span>
              <span className={`font-bold ${isTestnet ? 'text-amber-400' : 'text-emerald-400'}`}>{piReserve.toLocaleString()} {piSymbol}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[9px]">{mbzrSymbol} Reserve (L2 Supply)</span>
              <span className="font-bold text-cyan-400">{mbzrReserve.toLocaleString()} {mbzrSymbol}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}