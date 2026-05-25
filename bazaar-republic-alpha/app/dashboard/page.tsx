"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface PioneerStatus {
  status: 'NULL' | 'BOOTSTRAP_LOCKED' | 'VALIDATOR_ACTIVE';
  contract_id: string;
}

export default function DashboardTrafficController() {
  const { pioneer } = useAuth();
  const [pioneerState, setPioneerState] = useState<PioneerStatus | null>(null);

  useEffect(() => {
    const mockSorobanCall = async () => {
      setPioneerState({ status: 'VALIDATOR_ACTIVE', contract_id: 'CA_MESH_001' });
    };
    mockSorobanCall();
  }, [pioneer]);

  if (!pioneerState) return <div className="text-emerald-500">SYNCING WITH LEDGER...</div>;

  if (pioneerState.status === 'NULL') {
    return <div className="p-8 text-emerald-500 border border-emerald-500">INITIATING SOROBAN STAKING...</div>;
  }

  if (pioneerState.status === 'BOOTSTRAP_LOCKED') {
    return <div className="p-8 text-amber-500">TRANSACTION PENDING IN LEDGER...</div>;
  }

  // PHASE 4: COMMAND CENTER (Verified Block)
  return (
    <div className="bg-slate-950 min-h-screen text-slate-300">
      <nav className="p-6 border-b border-emerald-900/50">
        <h1 className="text-xl font-bold text-emerald-500 uppercase tracking-widest">Bazaar Republic</h1>
        <p className="text-xs text-slate-500">Node: {pioneer.username || "PioneerNode"} | Clearance: PIONEER</p>
      </nav>

      <main className="p-6 grid gap-6">
        {/* INSERT EXISTING UI COMPONENTS HERE */}
        <div className="border border-emerald-900/30 p-4">COMMAND CENTER ACTIVE</div>
      </main>

      <footer className="p-6 mt-10 border-t border-emerald-900/50">
        <p className="text-xs text-slate-500 tracking-wider">
          LEDGER-VERIFIED: {pioneerState.contract_id}
        </p>
      </footer>
    </div>
  );
}