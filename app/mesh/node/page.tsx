'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Cpu, 
  Server, 
  Activity, 
  ShieldCheck, 
  Zap, 
  Coins, 
  ArrowLeft, 
  RefreshCw, 
  Power, 
  Terminal, 
  CheckCircle2, 
  TrendingUp, 
  Database,
  Lock,
  Wifi,
  HardDrive
} from 'lucide-react';

interface NodeJob {
  id: string;
  type: 'ZK_PROOF' | 'A2U_RECOVERY' | 'STATE_SYNC';
  status: 'PROCESSING' | 'COMPLETED' | 'QUEUED';
  reward: number;
  time: string;
}

export default function MeshNodePage() {
  // Node Operational State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [stakedCollateral, setStakedCollateral] = useState<number>(10000);
  const [unclaimedYield, setUnclaimedYield] = useState<number>(142.85);
  const [uptimePercentage, setUptimePercentage] = useState<number>(99.8);
  const [p2pLatency, setP2pLatency] = useState<number>(18); // ms
  
  // Action Loading States
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [isTogglingPower, setIsTogglingPower] = useState<boolean>(false);

  // Active Relayer Jobs
  const [jobs, setJobs] = useState<NodeJob[]>([
    {
      id: 'JOB-8841-ZK',
      type: 'ZK_PROOF',
      status: 'PROCESSING',
      reward: 2.5,
      time: 'Just now',
    },
    {
      id: 'JOB-8840-A2U',
      type: 'A2U_RECOVERY',
      status: 'COMPLETED',
      reward: 1.2,
      time: '2m ago',
    },
    {
      id: 'JOB-8839-SYNC',
      type: 'STATE_SYNC',
      status: 'COMPLETED',
      reward: 0.8,
      time: '5m ago',
    },
  ]);

  // Simulated Live Terminal Logs
  const [logs, setLogs] = useState<string[]>([
    '[INIT] DePIN Node Engine v1.0.4 initialized.',
    '[P2P] Connected to 24 MESH Peers via WebSocket.',
    '[STAKE] 10,000 mBZR Collateral verified on-chain.',
    '[PROVER] Noir ZK-Prover worker thread active (Port 8080).',
  ]);

  // Simulate Live Node Ping & Jobs
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      // Fluctuate Latency slightly
      setP2pLatency(15 + Math.floor(Math.random() * 8));

      // Periodically accumulate micro-yield
      setUnclaimedYield((prev) => parseFloat((prev + 0.05).toFixed(2)));
    }, 4000);

    return () => clearInterval(interval);
  }, [isOnline]);

  // Handle Power Toggle
  const handleToggleNode = async () => {
    setIsTogglingPower(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsOnline(!isOnline);
    setIsTogglingPower(false);

    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setLogs((prev) => [
      `[${timestamp}] Node power state toggled to: ${!isOnline ? 'ONLINE' : 'OFFLINE'}`,
      ...prev,
    ]);
  };

  // Handle Yield Claim
  const handleClaimYield = async () => {
    if (unclaimedYield <= 0) return;
    setIsClaiming(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const claimed = unclaimedYield;
    setUnclaimedYield(0);
    setIsClaiming(false);

    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setLogs((prev) => [
      `[${timestamp}] Successfully claimed ${claimed.toFixed(2)} mBZR to Pioneer Treasury!`,
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-3 sm:p-6 font-sans pb-28">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* HEADER BAR */}
        <div className="flex items-center justify-between pt-2">
          <Link 
            href="/mesh" 
            className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft size={16} /> Hub
          </Link>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
              <Cpu size={10} /> DePIN Operator
            </span>
          </div>
        </div>

        {/* HERO TITLE & POWER CONTROL */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu size={18} className="text-emerald-400" /> DePIN Node Operator
                </h1>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                Node ID: <span className="text-neutral-200">BZR-RELAYER-X570</span>
              </p>
            </div>

            {/* NODE POWER SWITCH */}
            <button
              onClick={handleToggleNode}
              disabled={isTogglingPower}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-center ${
                isOnline
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400 shadow-lg shadow-emerald-950/50'
                  : 'bg-rose-950/80 border-rose-800 text-rose-400'
              }`}
            >
              {isTogglingPower ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Power size={20} />
              )}
            </button>
          </div>

          {/* REAL-TIME TELEMETRY STATS GRID */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-950 rounded-2xl border border-neutral-800 font-mono text-xs">
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block">Status</span>
              <span className={`font-bold text-xs flex items-center gap-1 ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block">P2P Latency</span>
              <span className="font-bold text-cyan-400 text-xs flex items-center gap-1">
                <Wifi size={12} /> {isOnline ? `${p2pLatency}ms` : '--'}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block">Uptime Shield</span>
              <span className="font-bold text-amber-400 text-xs flex items-center gap-1">
                <ShieldCheck size={12} /> {uptimePercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* REWARDS & COLLATERAL STAKING */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-3">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
            <span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Coins size={16} className="text-amber-400" /> PoCS Yield & Staking
            </span>
            <span className="text-[10px] font-mono text-neutral-500">Node Collateral</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* STAKED COLLATERAL */}
            <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">Staked Collateral</span>
              <span className="text-sm font-bold font-mono text-cyan-400 flex items-center gap-1">
                <Lock size={12} /> {stakedCollateral.toLocaleString()} mBZR
              </span>
              <span className="text-[9px] font-mono text-emerald-400 block">Adjudicator Level Active</span>
            </div>

            {/* UNCLAIMED YIELD */}
            <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">Unclaimed Yield</span>
              <span className="text-sm font-bold font-mono text-amber-400 flex items-center gap-1">
                <TrendingUp size={12} /> {unclaimedYield.toFixed(2)} mBZR
              </span>
              <span className="text-[9px] font-mono text-neutral-400 block">Relayer Service APY ~18.4%</span>
            </div>
          </div>

          {/* CLAIM BUTTON */}
          <button
            onClick={handleClaimYield}
            disabled={isClaiming || unclaimedYield <= 0 || !isOnline}
            className={`w-full py-3 px-4 rounded-xl font-bold font-mono text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 ${
              isClaiming
                ? 'bg-amber-950 border border-amber-800 text-amber-400 cursor-wait'
                : unclaimedYield <= 0 || !isOnline
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-linear-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white shadow-amber-950/50'
            }`}
          >
            {isClaiming ? (
              <>
                <RefreshCw size={14} className="animate-spin text-amber-300" />
                Executing On-Chain Settlement...
              </>
            ) : (
              <>
                <Coins size={14} />
                Claim {unclaimedYield.toFixed(2)} mBZR Yield
              </>
            )}
          </button>
        </div>

        {/* LIVE RELAYER WORKLOAD QUEUE */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={16} className="text-cyan-400" /> Active Relayer Jobs
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              3 Active Queues
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-200">{job.id}</span>
                    <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.2 rounded">
                      {job.type}
                    </span>
                  </div>
                  <span className="text-[9px] text-neutral-500 block">{job.time}</span>
                </div>

                <div className="text-right">
                  <span className="text-amber-400 font-bold block">+{job.reward} mBZR</span>
                  <span className={`text-[9px] font-bold ${job.status === 'PROCESSING' ? 'text-cyan-400 animate-pulse' : 'text-emerald-400'}`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REAL-TIME TERMINAL LOGS */}
        <div className="bg-black/90 border border-neutral-800 rounded-2xl p-3 font-mono text-[10px] space-y-1.5 shadow-2xl">
          <div className="flex justify-between items-center pb-1.5 border-b border-neutral-800 text-neutral-500">
            <span className="flex items-center gap-1.5 font-bold text-neutral-400">
              <Terminal size={12} className="text-emerald-400" /> DePIN NODE TERMINAL
            </span>
            <button 
              onClick={() => setLogs(['[RESET] Terminal output cleared.'])} 
              className="hover:text-white transition"
            >
              Clear
            </button>
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {logs.map((line, idx) => (
              <div key={idx} className="text-neutral-300 leading-tight break-all">
                {line}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}