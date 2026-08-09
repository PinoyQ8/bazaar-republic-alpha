// Location: app/dashboard/treasury/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PioneerAuthGate from "@/app/components/PioneerAuthGate";
import { getTreasuryData } from "@/app/actions/treasuryActions";
import { ShieldCheck, Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw, Lock } from "lucide-react";

export default function TreasuryViewport() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadTreasury = async () => {
    setIsLoading(true);
    setStatusMsg("Synchronizing Treasury Ledger...");
    const res = await getTreasuryData("local_x570_node");
    if (res.success) {
      setData(res);
      setStatusMsg("✅ Treasury Synchronized.");
    } else {
      setStatusMsg(`🚨 FRACTURE: ${res.message}`);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTreasury();
  }, []);

  return (
    <PioneerAuthGate>
      <div className="min-h-screen bg-black text-neutral-300 font-mono p-4 md:p-8 space-y-6 pb-24">
        
        {/* 🛰️ HEADER MATRIX */}
        <header className="border-b border-amber-900/60 pb-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-amber-500" />
              <h1 className="text-xl font-bold tracking-tight text-amber-500 uppercase">
                DAO Treasury & mBZR Vault
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={loadTreasury}
                disabled={isLoading}
                className="text-xs px-3 py-1 bg-neutral-900 border border-neutral-700 rounded text-neutral-400 hover:text-amber-400 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                SYNC
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-xs px-3 py-1 bg-neutral-900 border border-neutral-700 rounded text-neutral-400 hover:text-amber-400 transition-colors"
              >
                DASHBOARD
              </button>
            </div>
          </div>
          <p className="text-xs text-neutral-500 uppercase tracking-widest">
            Zero-Trust Liquidity • Real-Time Subsidy & Tax Settlement Tracking
          </p>
        </header>

        {/* 📢 TELEMETRY FEEDBACK */}
        {statusMsg && (
          <div className="p-3 bg-neutral-900 border border-amber-600/60 text-amber-400 text-xs rounded shadow-[0_0_10px_rgba(217,119,6,0.2)]">
            {statusMsg}
          </div>
        )}

        {isLoading && !data ? (
          <div className="p-12 text-center text-emerald-400 animate-pulse text-sm">
            CONNECTING TO MESH LEDGER...
          </div>
        ) : data && data.vault ? (
          <div className="space-y-6">
            
            {/* 📊 LIQUIDITY GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 bg-neutral-900/40 border border-emerald-500/30 rounded-xl space-y-1">
                <p className="text-[10px] text-emerald-500/70 uppercase tracking-wider">mBZR Liquidity</p>
                <p className="text-3xl font-bold text-emerald-400">{data.vault.mbzrBalance.toFixed(2)}</p>
                <p className="text-[10px] text-neutral-500">Available Credit</p>
              </div>
              <div className="p-5 bg-neutral-900/40 border border-amber-500/30 rounded-xl space-y-1">
                <p className="text-[10px] text-amber-500/70 uppercase tracking-wider">Staked Collateral</p>
                <p className="text-3xl font-bold text-amber-400">{data.vault.stakeAmount} Pi</p>
                <p className="text-[10px] text-neutral-500">Securing Node Operations</p>
              </div>
              <div className="p-5 bg-neutral-900/40 border border-cyan-500/30 rounded-xl space-y-1">
                <p className="text-[10px] text-cyan-500/70 uppercase tracking-wider">Trust Score Weight</p>
                <p className="text-3xl font-bold text-cyan-400">{data.vault.trustScore} / 100</p>
                <p className="text-[10px] text-neutral-500">Max Discount Yield</p>
              </div>
              <div className="p-5 bg-neutral-900/40 border border-purple-500/30 rounded-xl space-y-1">
                <p className="text-[10px] text-purple-500/70 uppercase tracking-wider">DAO Subsidies Secured</p>
                <p className="text-3xl font-bold text-purple-400">{data.vault.totalSubsidiesEarned.toFixed(2)}</p>
                <p className="text-[10px] text-neutral-500">Cumulative Savings</p>
              </div>
            </div>

            {/* 📜 IMMUTABLE TRANSACTION LEDGER */}
            <div className="p-6 bg-neutral-900/40 border border-neutral-800 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Immutable Transaction Ledger Feed
              </h3>

              {data.transactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 border border-neutral-800 rounded">
                  No transaction telemetry recorded in local ledger.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.transactions.map((tx: any) => (
                    <div key={tx.txId} className="p-3 bg-black/60 border border-neutral-800 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">{tx.txId}</span>
                          <span className="text-neutral-500">•</span>
                          <span className="text-neutral-300">Cart Value: {tx.cartValue} Pi</span>
                        </div>
                        <p className="text-[10px] text-neutral-500">
                          Timestamp: {new Date(tx.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-purple-400">Subsidy Applied: -{tx.subsidyApplied?.toFixed(2)} Pi</p>
                          <p className="text-neutral-400 text-[10px]">Buyer Paid: {tx.buyerPaid?.toFixed(2)} Pi</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : null}

      </div>
    </PioneerAuthGate>
  );
}