'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { 
  Vote, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  ArrowLeft, 
  Plus, 
  Clock, 
  Percent, 
  Loader2, 
  AlertCircle,
  Sparkles,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

// 🛡️ GOVERNANCE CONSTANTS
const CONSENSUS_THRESHOLD_PERCENT = 80;

const TIER_WEIGHTS: Record<string, number> = {
  PIONEER: 1,
  E_NETWORK_PROVIDER: 2,
  MESH_GUARDIAN: 5,
  SECURITY_ADJUDICATOR: 10,
  BAZAAR_FOUNDER: 20,
};

interface DaoVoteRecord {
  id: string;
  proposalId: string;
  pioneerUid: string;
  choice: 'FOR' | 'AGAINST' | 'ABSTAIN';
  votingPower: number;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  category: 'PROTOCOL_PARAMETER' | 'TREASURY_GRANT' | 'SECURITY_SLASHING' | 'E_NETWORK_EXPANSION';
  proposerUid: string;
  status: 'ACTIVE' | 'PASSED' | 'REJECTED';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  votes?: DaoVoteRecord[];
  expiresAt: string;
  createdAt: string;
}

export default function DaoProposalsPage() {
  const { pioneer } = useAuth();
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState<string | null>(null);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState<boolean>(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PASSED' | 'REJECTED'>('ALL');
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<Proposal['category']>('PROTOCOL_PARAMETER');

  // Compute User Voting Power with Null-Safety Shield
  const userTierWeight = TIER_WEIGHTS[pioneer?.tier || 'PIONEER'] || 1;
  const userTrustScore = pioneer?.trustScore || 100;
  const effectiveVotingPower = userTierWeight * (userTrustScore / 100);

  // 🛡️ 1. FETCH LIVE PROPOSALS FROM API
  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dao/proposals');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to pull proposals from ledger.');
      setProposals(data.telemetry.proposals || []);
    } catch (err: any) {
      console.error('[MESH-DAO] Proposals Sync Error:', err);
      setError(err.message || 'Error connecting to DAO governance route.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // 🛡️ 2. SUBMIT ATOMIC VOTE TO API
  const handleCastVote = async (proposalId: string, choice: 'FOR' | 'AGAINST' | 'ABSTAIN') => {
    if (!pioneer?.uid) {
      setFeedback({ type: 'error', msg: 'UNAUTHENTICATED_NODE: Valid Pioneer UID required.' });
      return;
    }

    setIsSubmittingVote(proposalId);
    setFeedback(null);

    try {
      const res = await fetch('/api/dao/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          pioneerUid: pioneer.uid,
          choice,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Governance vote dispatch failed.');
      }

      setFeedback({
        type: 'success',
        msg: `Vote [${choice}] recorded with ${data.telemetry.votingPowerApplied.toFixed(1)} VP. Current consensus: ${data.telemetry.consensusPercent.toFixed(1)}%.`,
      });

      await fetchProposals();
    } catch (err: any) {
      console.error('[MESH-DAO] Vote Submission Exception:', err);
      setFeedback({ type: 'error', msg: err.message || 'Failed to broadcast governance vote.' });
    } finally {
      setIsSubmittingVote(null);
    }
  };

  // 🛡️ 3. BROADCAST NEW PROPOSAL TO API
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) return;
    if (!pioneer?.uid) {
      setFeedback({ type: 'error', msg: 'UNAUTHENTICATED_NODE: Proposer UID missing.' });
      return;
    }

    setIsSubmittingProposal(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/dao/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
          proposerUid: pioneer.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Proposal creation failed.');
      }

      setFeedback({
        type: 'success',
        msg: `Proposal [${data.telemetry.proposal.id}] broadcasted with initial ${data.telemetry.initialVotingPower.toFixed(1)} VP FOR vote.`,
      });

      setNewTitle('');
      setNewDescription('');
      setShowNewModal(false);

      await fetchProposals();
    } catch (err: any) {
      console.error('[MESH-DAO] Proposal Creation Exception:', err);
      setFeedback({ type: 'error', msg: err.message || 'Failed to broadcast proposal.' });
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const filteredProposals = proposals.filter((p) => {
    if (filter === 'ALL') return true;
    return p.status === filter;
  });

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-6 min-h-screen bg-zinc-950 text-zinc-100 font-mono selection:bg-emerald-500/30 space-y-6">
      
      {/* 🛡️ MODULE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/academy" className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-emerald-400 font-bold tracking-widest uppercase text-sm flex items-center gap-2">
              <Vote className="w-4 h-4 text-emerald-500" /> DAO GOVERNANCE PORTAL
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">5-Tier Weighted Consensus Matrix (80% Threshold)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProposals}
            disabled={loading}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 rounded transition-colors disabled:opacity-50"
            title="Refresh Proposals"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowNewModal(true)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold uppercase rounded flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <Plus className="w-4 h-4" /> Draft Proposal
          </button>
        </div>
      </div>

      {/* 🛡️ FEEDBACK NOTIFICATION */}
      {feedback && (
        <div className={`p-3 border rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-300 ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' 
            : 'bg-red-950/30 border-red-900/50 text-red-400'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* 🛡️ USER GOVERNANCE POWER TELEMETRY */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <Shield className="w-3 h-3 text-cyan-400" /> Active Governance Node
          </span>
          <p className="text-xs font-bold text-zinc-200">
            Node Tier: <span className="text-cyan-400">{pioneer?.tier || 'PIONEER'}</span>
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block">Tier Multiplier</span>
            <span className="text-sm font-bold text-emerald-400">{userTierWeight}x</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block">Trust Score</span>
            <span className="text-sm font-bold text-purple-400">{userTrustScore}</span>
          </div>
          <div className="border-l border-zinc-800 pl-6">
            <span className="text-[10px] text-zinc-500 uppercase block">Voting Power</span>
            <span className="text-sm font-bold text-amber-400">{effectiveVotingPower.toFixed(1)} VP</span>
          </div>
        </div>
      </div>

      {/* 🛡️ PROPOSAL FILTERS */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        {(['ALL', 'ACTIVE', 'PASSED', 'REJECTED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
              filter === tab 
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 🛡️ PROPOSALS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-lg text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Scanning MongoDB Governance Records...
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-lg text-center text-zinc-500 text-xs">
            No governance proposals found in this sector.
          </div>
        ) : (
          filteredProposals.map((prop) => {
            const totalForAgainst = prop.votesFor + prop.votesAgainst;
            const consensusPercent = totalForAgainst > 0 ? (prop.votesFor / totalForAgainst) * 100 : 0;
            const isPassing = consensusPercent >= CONSENSUS_THRESHOLD_PERCENT;
            const isVotingThis = isSubmittingVote === prop.id;

            const userVote = prop.votes?.find((v) => v.pioneerUid === pioneer?.uid);
            const userVotedChoice = userVote?.choice;

            return (
              <div key={prop.id} className="p-5 bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-lg space-y-4 transition-all">
                
                {/* Proposal Top Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-900/50 px-2 py-0.5 rounded">
                      {prop.id}
                    </span>
                    <span className="text-[9px] font-mono text-purple-400 bg-purple-950/40 border border-purple-900/30 px-2 py-0.5 rounded uppercase">
                      {prop.category.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Proposer: {prop.proposerUid}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Expires: {new Date(prop.expiresAt).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      prop.status === 'PASSED' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' 
                        : prop.status === 'REJECTED' 
                          ? 'bg-red-950 text-red-400 border border-red-900' 
                          : 'bg-amber-950 text-amber-400 border border-amber-900'
                    }`}>
                      {prop.status}
                    </span>
                  </div>
                </div>

                {/* Proposal Details */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 mb-1">{prop.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{prop.description}</p>
                </div>

                {/* 80% Consensus Progress Matrix */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Percent className="w-3 h-3 text-emerald-400" /> Current Consensus: 
                      <strong className={isPassing ? 'text-emerald-400' : 'text-amber-400'}>
                        {consensusPercent.toFixed(1)}%
                      </strong>
                    </span>
                    <span className="text-zinc-500">Supermajority Required: {CONSENSUS_THRESHOLD_PERCENT}%</span>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="relative w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${Math.min(100, consensusPercent)}%` }}
                    />
                    <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-amber-400 z-10" title="80% Threshold" />
                  </div>
                </div>

                {/* Voting Actions / Status */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-3 border-t border-zinc-800/60">
                  <div className="text-[10px] text-zinc-500 flex items-center gap-4">
                    <span className="text-emerald-400">FOR: {prop.votesFor.toFixed(0)} VP</span>
                    <span className="text-red-400">AGAINST: {prop.votesAgainst.toFixed(0)} VP</span>
                    <span className="text-zinc-400">ABSTAIN: {prop.votesAbstain.toFixed(0)} VP</span>
                  </div>

                  {userVotedChoice ? (
                    <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 border border-emerald-900/50 px-3 py-1.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Voted [{userVotedChoice}]
                    </div>
                  ) : prop.status !== 'ACTIVE' ? (
                    <span className="text-[10px] text-zinc-500 italic">Voting Closed</span>
                  ) : (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleCastVote(prop.id, 'FOR')}
                        disabled={isVotingThis}
                        className="flex-1 md:flex-none px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {isVotingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Vote For
                      </button>

                      <button
                        onClick={() => handleCastVote(prop.id, 'AGAINST')}
                        disabled={isVotingThis}
                        className="flex-1 md:flex-none px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {isVotingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Vote Against
                      </button>

                      <button
                        onClick={() => handleCastVote(prop.id, 'ABSTAIN')}
                        disabled={isVotingThis}
                        className="flex-1 md:flex-none px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {isVotingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <MinusCircle className="w-3 h-3" />} Abstain
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* 🛡️ NEW PROPOSAL DRAFT MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-lg w-full space-y-4">
            
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Draft Republic Governance Proposal
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-zinc-500 hover:text-zinc-300 text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Proposal Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Adjust MESH-SCAN Slashing Penalty"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as Proposal['category'])}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="PROTOCOL_PARAMETER">PROTOCOL PARAMETER</option>
                  <option value="TREASURY_GRANT">TREASURY GRANT</option>
                  <option value="SECURITY_SLASHING">SECURITY SLASHING</option>
                  <option value="E_NETWORK_EXPANSION">E-NETWORK EXPANSION</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Description / Rationale</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
                  placeholder="Provide technical justification for this governance proposal..."
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-500 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>Drafting requires active Pioneer status. Your initial voting power of {effectiveVotingPower.toFixed(1)} VP will be automatically cast FOR this proposal upon deployment.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  disabled={isSubmittingProposal}
                  className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-bold uppercase rounded disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProposal}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold uppercase rounded shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingProposal ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Proposal'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </main>
  );
}