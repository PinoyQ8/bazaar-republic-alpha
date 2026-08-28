// Location: app/academy/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, 
  AlertTriangle, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  ArrowLeft, 
  ChevronRight, 
  Sparkles, 
  Zap, 
  GraduationCap,
  ArrowRight,
  Award
} from 'lucide-react';
import PioneerAuthGate from '@/app/components/PioneerAuthGate';

export type DaoRole =
  | 'GENESIS_ELDER'
  | 'MESH_VALIDATOR'
  | 'DEFI_ARBITRAGEUR'
  | 'ECO_DEVELOPER'
  | 'CADET_INITIATE';

interface RoleBadgeConfig {
  label: string;
  color: string;
  border: string;
  bg: string;
  duty: string;
}

const ROLE_CONFIGS: Record<DaoRole, RoleBadgeConfig> = {
  GENESIS_ELDER: {
    label: 'Genesis Elder',
    color: 'text-purple-400',
    border: 'border-purple-800/60',
    bg: 'bg-purple-950/40',
    duty: 'VRF Adjudication & Multisig Governance',
  },
  MESH_VALIDATOR: {
    label: 'Mesh Validator',
    color: 'text-emerald-400',
    border: 'border-emerald-800/60',
    bg: 'bg-emerald-950/40',
    duty: 'SoloHost RPC Relay & Telemetry Keeper',
  },
  DEFI_ARBITRAGEUR: {
    label: 'DeFi Arbitrageur',
    color: 'text-amber-400',
    border: 'border-amber-800/60',
    bg: 'bg-amber-950/40',
    duty: 'Vault Staking & 1:1,000 Peg Stability',
  },
  ECO_DEVELOPER: {
    label: 'Eco Developer',
    color: 'text-cyan-400',
    border: 'border-cyan-800/60',
    bg: 'bg-cyan-950/40',
    duty: 'Merchant Escrow & ZK Attestation Integration',
  },
  CADET_INITIATE: {
    label: 'Cadet Initiate',
    color: 'text-slate-400',
    border: 'border-slate-800',
    bg: 'bg-slate-900/60',
    duty: 'Complete Academy Modules to Unlock DAO Deployment',
  },
};

interface AcademyPhase {
  phaseNumber: number;
  code: string;
  title: string;
  subtitle: string;
  summary: string;
  primaryRoute: string;
  secondaryRoute?: string;
  secondaryLabel?: string;
  tierUnlocked: string;
}

export default function AcademyPage() {
  const { pioneer, login, isHydrated } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePhaseNum, setActivePhaseNum] = useState<number>(1);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 🛡️ Active Node Status Check
  const isActive = useMemo(() => {
    if (!pioneer?.isAuthenticated) return false;
    const status = pioneer?.status?.toUpperCase();
    return status === 'ACTIVE' || status === 'FROZEN' || status === 'SUSPENDED' || !!pioneer?.tier;
  }, [pioneer]);

  // 🛡️ Sync Academy Progression
  useEffect(() => {
    async function fetchAcademyState() {
      if (!isHydrated || !pioneer?.uid) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/academy/progress?uid=${pioneer.uid}`);
        if (res.ok) {
          const data = await res.json();
          setCompletedModules(data.completedModules || []);
        }
      } catch (err) {
        console.error('Failed to sync Academy state:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAcademyState();
  }, [pioneer?.uid, isHydrated]);

  // 🛡️ Dynamic Role Evaluation
  const assignedRole: DaoRole = useMemo(() => {
    const count = completedModules.length;
    const ts = pioneer?.trustScore ?? 100;

    if (count >= 3 && ts >= 85) return 'GENESIS_ELDER';
    if (count >= 2 && ts >= 60) return 'MESH_VALIDATOR';
    if (count >= 3) return 'DEFI_ARBITRAGEUR';
    if (count >= 1) return 'ECO_DEVELOPER';
    return 'CADET_INITIATE';
  }, [completedModules.length, pioneer?.trustScore]);

  const roleMeta = ROLE_CONFIGS[assignedRole];

  // 🛡️ Genesis Upgrade Pipeline
  const handleGenesisUpgrade = async () => {
    if (!pioneer?.uid) {
      setError('MESH_ERROR: Node Identity Missing. Reboot session.');
      return;
    }

    setIsUpgrading(true);
    setError(null);

    try {
      const res = await fetch('/api/academy/genesis-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: pioneer.uid }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ledger synchronization failed.');

      login({
        uid: pioneer.uid,
        username: pioneer.username,
        status: data.status || 'ACTIVE',
        tier: data.tier || 'NOVICE',
      });

      setActivePhaseNum(2);
    } catch (err: any) {
      console.error('[MESH-SCAN] Upgrade Fault:', err);
      setError(err.message || 'Critical fault during upgrade sequence.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const phases: AcademyPhase[] = [
    {
      phaseNumber: 1,
      code: 'MESH-101',
      title: 'Genesis Identity & Passkeys',
      subtitle: 'Samsung Knox Enclave & Hardware Attestation',
      summary: 'Acknowledge the Republic Mandate, anchor your node identity to the MESH Ledger, and configure Knox WebAuthn hardware passkeys.',
      primaryRoute: '/academy/module-01',
      secondaryRoute: '/mesh/harness',
      secondaryLabel: 'S23 Test Harness',
      tierUnlocked: 'NOVICE',
    },
    {
      phaseNumber: 2,
      code: 'MESH-201',
      title: 'DAO Architecture & $mBZR AMM',
      subtitle: 'Constant Product (x * y = k) & Relayer Trade',
      summary: 'Master 5-Tier DAO governance rules, 0.3% protocol fee distributions, and zero-gas state relayer operations.',
      primaryRoute: '/academy/module-02',
      secondaryRoute: '/mesh/swap',
      secondaryLabel: 'AMM Swap Lab',
      tierUnlocked: 'ACADEMY_CORE',
    },
    {
      phaseNumber: 3,
      code: 'MESH-301',
      title: 'Alpha Track & Merchant Escrow',
      subtitle: '48-Hour Timelocks & Noir ZK Dispute Audits',
      summary: 'Execute Genesis Minting payloads, non-custodial merchant escrow locks, and evaluate ZK dispute proofs.',
      primaryRoute: '/alpha-track',
      secondaryRoute: '/mesh/escrow',
      secondaryLabel: 'Escrow Vaults',
      tierUnlocked: 'ACADEMY_CORE',
    },
    {
      phaseNumber: 4,
      code: 'MESH-401',
      title: 'DePIN Operations & 70/30 Matrix',
      subtitle: 'Proof-of-Capacity/Staking & Telemetry Daemon',
      summary: 'Operate off-chain ZK relayers, monitor real-time CPU/RAM telemetry, stake mBZR collateral, and collect 30-day epoch yield splits.',
      primaryRoute: '/mesh/node',
      secondaryRoute: '/mesh',
      secondaryLabel: 'L2 Hub Center',
      tierUnlocked: 'MESH_GUARDIAN',
    },
  ];

  return (
    <PioneerAuthGate>
      <main className="w-full max-w-[384px] mx-auto p-3 sm:p-4 pb-24 min-h-screen text-slate-100 font-mono selection:bg-emerald-500/30 flex flex-col gap-4">
        
        {/* HEADER */}
        <div className="border-b border-slate-800 pb-3 mt-1">
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2">
                <Link 
                  href="/mesh"
                  className="p-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 rounded transition-colors"
                  title="Return to MESH Hub"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-emerald-400 font-bold tracking-widest uppercase text-xs sm:text-sm flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-amber-400" /> MESH ACADEMY
                </h1>
              </div>
              <div className="flex items-center gap-2 mt-2 ml-7">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Genesis 100 Cohort</p>
              </div>
            </div>

            <div className="text-right flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-500 tracking-widest">NODE TIER</span>
              <span className={`text-[11px] font-bold ${isActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                [{pioneer?.tier || 'CITIZEN'}]
              </span>
            </div>
          </div>
        </div>

        {/* TALENT CARD */}
        <section className={`p-3.5 rounded-xl border ${roleMeta.border} ${roleMeta.bg} flex flex-col gap-2 shadow-lg`}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" /> DAO Assignment
            </span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${roleMeta.border} ${roleMeta.color}`}>
              {roleMeta.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {roleMeta.duty}
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400">
            <span>Curriculum Progress:</span>
            <span className="text-white font-bold">{completedModules.length} / 3 Modules Cleared</span>
          </div>
        </section>

        {/* PIPELINE GRID */}
        <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Curriculum Pipeline</span>
            <span className="text-emerald-400">{isActive ? 'Node Activated' : 'Pending Activation'}</span>
          </div>

          <div className="grid grid-cols-4 gap-1 pt-1">
            {phases.map((p) => {
              const unlocked = p.phaseNumber === 1 || isActive;
              const isCurrent = activePhaseNum === p.phaseNumber;

              return (
                <button
                  key={p.phaseNumber}
                  onClick={() => unlocked && setActivePhaseNum(p.phaseNumber)}
                  className={`py-1.5 px-1 rounded-lg text-center border transition-all ${
                    isCurrent
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                      : unlocked
                      ? 'bg-slate-950 border-slate-800 text-slate-300'
                      : 'bg-slate-950/40 border-slate-900 text-slate-700 cursor-not-allowed'
                  }`}
                >
                  <span className="block text-[9px]">P{p.phaseNumber}</span>
                  <span className="block text-[8px] truncate">{p.code}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ERROR FAULT */}
        {error && (
          <div className="p-2.5 bg-rose-950/40 border border-rose-800/80 rounded-xl text-[10px] text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>[MESH FAULT] {error}</span>
          </div>
        )}

        {/* ACCORDION MODULE CARDS */}
        <div className="space-y-3">
          {phases.map((phase) => {
            const isPhaseUnlocked = phase.phaseNumber === 1 || isActive;
            const isSelected = activePhaseNum === phase.phaseNumber;

            return (
              <div
                key={phase.phaseNumber}
                className={`border rounded-xl transition-all overflow-hidden ${
                  !isPhaseUnlocked
                    ? 'bg-slate-950/40 border-slate-900 opacity-50'
                    : isSelected
                    ? 'bg-slate-900/80 border-emerald-500/60 ring-1 ring-emerald-500/20 shadow-lg'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => isPhaseUnlocked && setActivePhaseNum(isSelected ? 0 : phase.phaseNumber)}
                  className="w-full p-3 text-left flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        phase.phaseNumber === 1 && isActive
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : isPhaseUnlocked
                          ? 'bg-slate-950 text-amber-400 border border-slate-800'
                          : 'bg-slate-950 text-slate-700 border border-slate-900'
                      }`}
                    >
                      {phase.phaseNumber === 1 && isActive ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      ) : isPhaseUnlocked ? (
                        <Unlock className="w-3.5 h-3.5" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div>
                      <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                        Phase 0{phase.phaseNumber} • {phase.code}
                      </div>
                      <div className="text-xs font-bold text-slate-100 leading-tight">
                        {phase.title}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 text-slate-500 transition-transform ${isSelected ? 'rotate-90 text-emerald-400' : ''}`}
                  />
                </button>

                {isSelected && (
                  <div className="px-3 pb-3 pt-2 border-t border-slate-800/80 space-y-2.5">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      {phase.summary}
                    </p>

                    {phase.phaseNumber === 1 && !isActive ? (
                      <button
                        onClick={handleGenesisUpgrade}
                        disabled={isUpgrading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex justify-center items-center gap-2 shadow-lg"
                      >
                        {isUpgrading ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> SYNCHRONIZING LEDGER...</>
                        ) : (
                          "ACKNOWLEDGE & UPGRADE NODE"
                        )}
                      </button>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        <Link 
                          href={phase.primaryRoute} 
                          className="w-full py-2.5 bg-emerald-950/50 text-emerald-400 border border-emerald-800 hover:bg-emerald-900/60 text-center text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors"
                        >
                          Enter Core Module <ArrowRight className="w-3 h-3" />
                        </Link>

                        {phase.secondaryRoute && (
                          <Link 
                            href={phase.secondaryRoute} 
                            className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700/80 text-center text-[9px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Zap className="w-3 h-3 text-cyan-400" /> Launch {phase.secondaryLabel}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="mt-2 p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-1 text-[10px]">
          <div className="flex justify-between items-center text-slate-400">
            <span className="font-bold flex items-center gap-1 text-emerald-400">
              <Sparkles className="w-3 h-3" /> Genesis Mandate
            </span>
            <span className="text-slate-500">v2.7 Schema</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Completing Phase 1 upgrades your identity in MongoDB Atlas and unlocks the entire MESH Layer-2 trade suite.
          </p>
        </div>

      </main>
    </PioneerAuthGate>
  );
}