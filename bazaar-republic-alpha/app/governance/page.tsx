"use client";

import { useState, useEffect } from "react";
import PioneerAuthGate from "@/app/components/PioneerAuthGate";

// 🛡️ MESH TYPE MAPPING (Aligned with Schema v2.3)
interface Proposal {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "PASSED" | "REJECTED" | "EXPIRED";
  votesFor: number;
  votesAgainst: number;
  authorUid?: string;
  expiresAt?: string;
}

export default function GovernancePortal() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeUid, setActiveUid] = useState<string>("pi_test_node_01");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 🛡️ NEW PROPOSAL FORM STATE
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 🛡️ FETCH MASTER PROPOSALS ON LOAD
  const fetchProposals = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/governance/proposals');
      const data = await res.json();
      if (data.success) {
        setProposals(data.proposals);
      } else {
        setErrorMsg(data.error || "Failed to load governance stream.");
      }
    } catch (err) {
      console.error("[MESH-FRACTURE] Failed to fetch proposals:", err);
      setErrorMsg("Network disruption during MESH synchronization.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // 🛡️ LIVE VOTE DISPATCH
  const handleVote = async (id: string, decision: "YES" | "NO") => {
    try {
      const res = await fetch(`/api/governance/proposals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterUid: activeUid, decision })
      });
      const data = await res.json();

      if (data.success) {
        console.log(`[MESH-CONSENSUS] Vote recorded successfully for ${id}`);
        fetchProposals();
      } else {
        alert(`Vote Rejected: ${data.error}`);
      }
    } catch (err) {
      console.error("[MESH-FRACTURE] Vote dispatch fault:", err);
      alert("Failed to transmit vote to MESH.");
    }
  };

  // 🛡️ CREATE NEW PROPOSAL DISPATCH
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/governance/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          authorUid: activeUid
        })
      });
      const data = await res.json();

      if (data.success) {
        setNewTitle("");
        setNewDesc("");
        setShowCreateModal(false);
        fetchProposals();
      } else {
        alert(`Creation Failed: ${data.error}`);
      }
    } catch (err) {
      console.error("[MESH-FRACTURE] Proposal creation fault:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PioneerAuthGate onLinkEstablished={(uid) => setActiveUid(uid)}>
      {/* VIEWPORT LOCK: S23 Ultra (384px Safe) */}
      <main className="w-full max-w-[384px] mx-auto p-4 min-h-screen bg-zinc-950 text-zinc-100 font-mono overflow-x-hidden selection:bg-emerald-500/30 space-y-6">
        
        {/* TOP BAR / NAVIGATION SHIELD */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 gap-2">
          <div>
            <h2 className="text-emerald-400 font-bold tracking-widest uppercase text-sm">DAO CONSENSUS</h2>
            <p className="text-zinc-500 text-[11px] mt-0.5">Active Node: <span className="text-emerald-500 truncate inline-block max-w-25 align-bottom">{activeUid}</span></p>
          </div>
          <button 
            onClick={() => window.location.href = '/alpha-track'}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 text-[10px] font-bold uppercase rounded tracking-wider transition-colors shrink-0"
          >
            ALPHA TRACK
          </button>
        </div>

        {/* 🛡️ ACTION BAR */}
        <div className="flex justify-between items-center">
          <h3 className="text-xs text-zinc-400 uppercase tracking-widest">Network Proposals</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            + NEW MIP
          </button>
        </div>

        {/* 🛡️ CREATE PROPOSAL MODAL */}
        {showCreateModal && (
          <div className="bg-zinc-900 border border-emerald-500/40 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Forge New Proposal</span>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-zinc-300 text-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateProposal} className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">Proposal Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., MIP-3: Protocol Upgrade" 
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase mb-1">Description</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail the economic or structural changes..." 
                  rows={3}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Broadcasting..." : "Broadcast to MESH"}
              </button>
            </form>
          </div>
        )}

        {/* 🛡️ PROPOSAL FEED / ERROR / LOADING */}
        {isLoading ? (
          <div className="text-center py-12 text-zinc-500 text-xs animate-pulse">
            [MESH-SYNC] Fetching consensus ledger from database...
          </div>
        ) : errorMsg ? (
          <div className="bg-red-950/30 border border-red-900/50 p-4 rounded text-center text-red-400 text-xs">
            {errorMsg}
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-xs border border-dashed border-zinc-800 rounded-lg">
            No active proposals found in the MESH registry.
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((prop) => (
              <div key={prop.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-sm font-bold text-zinc-200">{prop.title}</h4>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider shrink-0 ${
                    prop.status === 'ACTIVE' ? 'bg-amber-900/50 text-amber-400 border border-amber-700/50' : 
                    prop.status === 'PASSED' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50' : 
                    'bg-red-900/50 text-red-400 border border-red-700/50'
                  }`}>
                    {prop.status}
                  </span>
                </div>
                
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {prop.description}
                </p>

                {/* TELEMETRY & VOTING */}
                <div className="pt-3 border-t border-zinc-800/50 space-y-2">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>YES: {prop.votesFor}</span>
                    <span>NO: {prop.votesAgainst}</span>
                  </div>

                  {prop.status === 'ACTIVE' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleVote(prop.id, "YES")}
                        className="flex-1 py-2 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800/50 rounded text-xs font-bold transition-colors"
                      >
                        VOTE YES
                      </button>
                      <button 
                        onClick={() => handleVote(prop.id, "NO")}
                        className="flex-1 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/50 rounded text-xs font-bold transition-colors"
                      >
                        VOTE NO
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </PioneerAuthGate>
  );
}