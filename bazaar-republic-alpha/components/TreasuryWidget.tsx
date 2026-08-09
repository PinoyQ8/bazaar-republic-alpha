// Location: components/TreasuryWidget.tsx
"use client";

import { useEffect, useState } from "react";
import { getTreasuryData } from "@/app/actions/treasuryActions";

export default function TreasuryWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const res = await getTreasuryData("local_x570_node");
      if (res.success) {
        setData(res);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-6 bg-black/40 border border-emerald-500/20 rounded-xl text-emerald-400 font-mono animate-pulse">SYNCHRONIZING TREASURY VAULT...</div>;
  }

  if (!data) {
    return <div className="p-6 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 font-mono">TREASURY SYNC FRACTURE</div>;
  }

  const { vault, transactions } = data;

  return (
    <div className="space-y-6">
      {/* 📊 Balance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-black/60 border border-emerald-500/30 rounded-xl">
          <p className="text-xs text-emerald-500/70 font-mono uppercase tracking-wider">mBZR Liquidity</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">{vault.mbzrBalance.toFixed(2)}</p>
        </div>
        <div className="p-5 bg-black/60 border border-emerald-500/30 rounded-xl">
          <p className="text-xs text-emerald-500/70 font-mono uppercase tracking-wider">Staked Collateral</p>
          <p className="text-3xl font-bold text-emerald-300 mt-1">{vault.stakeAmount} Pi</p>
        </div>
        <div className="p-5 bg-black/60 border border-emerald-500/30 rounded-xl">
          <p className="text-xs text-emerald-500/70 font-mono uppercase tracking-wider">Trust Score Weight</p>
          <p className="text-3xl font-bold text-cyan-400 mt-1">{vault.trustScore} / 100</p>
        </div>
        <div className="p-5 bg-black/60 border border-emerald-500/30 rounded-xl">
          <p className="text-xs text-emerald-500/70 font-mono uppercase tracking-wider">DAO Subsidies Secured</p>
          <p className="text-3xl font-bold text-purple-400 mt-1">{vault.totalSubsidiesEarned.toFixed(2)} mBZR</p>
        </div>
      </div>

      {/* 📜 Transaction Ledger Feed */}
      <div className="p-6 bg-black/60 border border-emerald-500/30 rounded-xl">
        <h3 className="text-lg font-mono font-semibold text-emerald-400 mb-4">🛡️ Immutable Transaction Ledger</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400 font-mono">No telemetry records found in local ledger.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <div key={tx.txId} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg text-xs font-mono">
                <div>
                  <span className="text-emerald-400 font-bold">{tx.txId}</span>
                  <span className="text-gray-400 ml-3">Cart: {tx.cartValue} Pi</span>
                </div>
                <div className="text-right">
                  <span className="text-purple-400">Subsidy: -{tx.subsidyApplied?.toFixed(2)} mBZR</span>
                  <span className="text-gray-500 ml-4">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}