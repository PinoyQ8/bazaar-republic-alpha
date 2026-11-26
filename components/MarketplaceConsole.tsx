// Location: components/MarketplaceConsole.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Lock, Package, ShoppingBag, Sparkles, Store } from "lucide-react";
import {
  getActiveListings,
  executeMarketTransaction,
  seedVirtualMarket,
} from "@/actions/marketActions";
import { useAuth } from "@/context/AuthContext";
import {
  canAccessSubSection,
  GOVERNANCE_TIER_META,
  GovernanceTierLevel,
  normalizeTierLevel,
} from "@/app/lib/governance/tierRbac";

export interface MarketplaceConsoleProps {
  governanceTier?: GovernanceTierLevel | string;
  hasRole?: boolean;
  hasPassport?: boolean;
  isFrozen?: boolean;
}

export default function MarketplaceConsole({
  governanceTier,
  hasRole,
  hasPassport,
  isFrozen,
}: MarketplaceConsoleProps) {
  const { pioneer, hasActiveRole: authHasRole } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"MARKET" | "INVENTORY">("MARKET");
  const [statusMsg, setStatusMsg] = useState<string>(
    "🛡️ MESH Connected under Protocol 26.1. Ready for zk-circuit transaction."
  );

  const effectiveTier = normalizeTierLevel(governanceTier ?? pioneer?.tier ?? 1);
  const tierMeta = GOVERNANCE_TIER_META[effectiveTier];
  const effectiveHasRole = hasRole ?? authHasRole;
  const effectiveHasPassport = hasPassport ?? Boolean(pioneer?.isAuthenticated);
  const effectiveFrozen = isFrozen ?? pioneer?.status === "FROZEN";

  const inventoryAccess = canAccessSubSection("MARKET_INVENTORY", {
    tier: effectiveTier,
    hasRole: effectiveHasRole,
    hasPassport: effectiveHasPassport,
    isFrozen: effectiveFrozen,
  });

  const activeBuyerUid = pioneer?.uid || "local_x570_node";

  const fetchMarketData = useCallback(async () => {
    const data = await getActiveListings();
    setListings(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  const handlePurchase = async (merchantId: string, pricePi: number) => {
    if (!activeBuyerUid || effectiveFrozen) return;
    setIsLoading(true);
    setStatusMsg("🛡️ Executing Protocol 25.2.2 zk-Circuit Transaction...");

    const res = await executeMarketTransaction(activeBuyerUid, merchantId, pricePi);
    const payload = res as any;

    if (payload?.success && payload?.receipt) {
      setStatusMsg(
        `✅ TX SECURED: ${payload.receipt.grossTotal.toFixed(2)} mBZR TOTAL. ` +
          `Breakdown ➔ [Unit Price: ${payload.receipt.unitPrice.toFixed(2)} | ` +
          `DAO Ops: ${payload.receipt.daoOperations.toFixed(2)} | ` +
          `Shield: ${payload.receipt.republicShield.toFixed(2)} | ` +
          `e-VAT: ${payload.receipt.eVat.toFixed(2)}]`
      );
    } else {
      setStatusMsg(`🚨 TX REJECTED: ${payload?.message || "Unknown Error"}`);
    }

    setIsLoading(false);
    await fetchMarketData();
  };

  return (
    <section className="min-h-screen bg-black text-emerald-400 p-4 pb-24 font-mono selection:bg-emerald-500 selection:text-black">
      {/* Header & RBAC Tier Badge */}
      <div className="flex flex-col gap-3 mb-5 border-b border-emerald-900 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] tracking-widest text-emerald-500 uppercase flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5" />
              PROTOCOL 26.1 // SECURE GATEWAY
            </div>
            <h1 className="text-lg font-bold text-white tracking-wider mt-1">
              E-NETWORK MARKETPLACE
            </h1>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Quad-Ledger Taxation & zk-Circuit Verification Active
            </p>
          </div>

          <span
            className={`shrink-0 rounded border px-2 py-0.5 text-[9px] font-bold ${tierMeta.badgeClass}`}
          >
            {tierMeta.shortLabel}
          </span>
        </div>

        {/* Market Catalog vs. Gated Inventory */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab("MARKET")}
            className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold cursor-pointer transition-colors ${
              activeTab === "MARKET"
                ? "border-emerald-500 bg-emerald-950/70 text-emerald-300"
                : "border-emerald-900/60 bg-black text-emerald-600 hover:border-emerald-700"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Market Catalog
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("INVENTORY")}
            className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold cursor-pointer transition-colors ${
              activeTab === "INVENTORY"
                ? inventoryAccess.allowed
                  ? "border-cyan-500 bg-cyan-950/60 text-cyan-300"
                  : "border-rose-700 bg-rose-950/40 text-rose-300"
                : "border-emerald-900/60 bg-black text-emerald-600 hover:border-emerald-700"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            Inventory
            {!inventoryAccess.allowed && <Lock className="h-3 w-3 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Telemetry Banner */}
      <div className="bg-emerald-950/20 border border-emerald-800/80 p-3.5 rounded-lg mb-5 text-xs text-emerald-300 flex items-start gap-2.5">
        <span className="w-2 h-2 mt-1 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <div className="leading-relaxed">
          <span className="font-bold text-white uppercase tracking-wider">
            Telemetry Adjudicator:
          </span>{" "}
          {statusMsg}
        </div>
      </div>

      {activeTab === "MARKET" ? (
        <div className="grid grid-cols-1 gap-4">
          {listings.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-emerald-900/60 rounded-lg text-emerald-600 text-xs space-y-2">
              <p>NO ACTIVE LISTINGS FOUND ON THE MESH.</p>
              <p className="text-[10px] text-emerald-700">
                {inventoryAccess.allowed
                  ? 'Open the "Inventory" tab to seed or publish listings.'
                  : "A Tier 2+ Merchant node must publish listings to populate the catalog."}
              </p>
            </div>
          ) : (
            listings.map((item) => (
              <div
                key={item.listingId}
                className="bg-emerald-950/10 border border-emerald-900/60 p-4 rounded-lg flex flex-col justify-between hover:border-emerald-700/60 transition-all"
              >
                <div>
                  <div className="text-[10px] text-emerald-500 tracking-wider uppercase mb-1">
                    {item.serviceCategory} // ID: {item.listingId}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                  <p className="text-xs text-emerald-300/70 mb-4 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="border-t border-emerald-900/50 pt-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[9px] text-emerald-500 uppercase">Valuation</div>
                    <div className="text-sm font-bold text-white">
                      {item.pricePi} Pi{" "}
                      <span className="text-[10px] text-emerald-400 font-normal">
                        ({item.pricePi * 1000} mBZR)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading || effectiveFrozen}
                    onClick={() => handlePurchase(item.providerId, item.pricePi)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black px-3.5 py-2 rounded text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/10 shrink-0"
                  >
                    ⚡ EXECUTE CONTRACT
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : !inventoryAccess.allowed ? (
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-bold text-rose-400 uppercase tracking-wider">
              <Lock className="h-4 w-4 shrink-0" />
              No Access to Inventory
            </span>
            <span className="rounded border border-amber-700/70 bg-amber-950/70 px-2 py-0.5 text-[9px] font-bold text-amber-300">
              {inventoryAccess.requiredTierLabel}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {inventoryAccess.reason ??
              "Users with no active role or Tier 1 (Citizen) cannot access merchant inventory."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Merchant Inventory & Seeder
              </span>
              <span className="text-[10px] text-emerald-400">
                Active Listings: {listings.length}
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Manage storefront inventory or seed sandbox listings into the MESH ledger.
            </p>

            <button
              type="button"
              disabled={effectiveFrozen}
              onClick={async () => {
                setStatusMsg(
                  "🌱 Seeding Virtual Market & Injecting 1M mBZR into Node..."
                );
                const res = await seedVirtualMarket();
                setStatusMsg(res.message);
                await fetchMarketData();
              }}
              className="w-full bg-emerald-950/80 border border-emerald-500 text-emerald-400 hover:bg-emerald-400 hover:text-black px-4 py-2.5 rounded text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              ⚡ SEED VIRTUAL MARKET (1M mBZR)
            </button>
          </div>
        </div>
      )}
    </section>
  );
}