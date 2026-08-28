// Location: app/registry/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  ExternalLink, 
  Cpu, 
  RefreshCw 
} from "lucide-react";

interface PioneerRegistryItem {
  id: string;
  uid: string;
  username?: string | null;
  walletAddress?: string | null;
  tier: string;
  status: string;
  trustScore: number;
  uptimeShield: number;
  stakedPi?: number;
  mbzrBalance?: number;
  lastActivityTimestamp: string | Date;
}

export default function PioneerRegistryPage() {
  const { pioneer } = useAuth();
  const [nodes, setNodes] = useState<PioneerRegistryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistry = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/mesh-scan");
      if (!res.ok) {
        throw new Error("Failed to fetch node registry telemetry.");
      }
      const data = await res.json();
      setNodes(data.nodes || []);
    } catch (err: any) {
      console.error("[REGISTRY_FETCH_ERROR]:", err);
      setError(err.message || "Failed to load MESH registry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, []);

  const filteredNodes = nodes.filter((node) => {
    const matchesQuery =
      (node.uid && node.uid.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (node.username && node.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (node.walletAddress && node.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier = filterTier === "ALL" || node.tier.toUpperCase() === filterTier.toUpperCase();

    return matchesQuery && matchesTier;
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <header className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4" /> BAZAAR REPUBLIC // NODE DIRECTORY
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-1">Pioneer Mesh Registry</h1>
          </div>
          <button
            onClick={fetchRegistry}
            disabled={isLoading}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sync Registry</span>
          </button>
        </header>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by UID, Username, or Stellar Address..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Tiers</option>
            <option value="GENESIS">Genesis</option>
            <option value="PIONEER">Pioneer</option>
            <option value="ELDER">Elder</option>
            <option value="MASTER">Master</option>
          </select>
        </div>

        {/* ERROR HUD */}
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* NODES TABLE / GRID */}
        {isLoading ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-xs text-cyan-400 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="tracking-widest uppercase animate-pulse">Querying Mesh Ledger...</span>
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
            No registered Pioneer nodes match your query parameters.
          </div>
        ) : (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Pioneer / UID</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">TrustScore</th>
                    <th className="py-3 px-4 text-center">Uptime Shield</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredNodes.map((node) => {
                    const isActive = node.status === "ACTIVE";
                    return (
                      <tr key={node.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-100">
                            {node.username || `@${node.uid}`}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-50">
                            {node.walletAddress || node.uid}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                            {node.tier}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                              isActive
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                                : "bg-red-950/60 text-red-400 border border-red-800/60"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                              }`}
                            />
                            {node.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-200">
                          {node.trustScore?.toFixed(1) ?? "100.0"}
                        </td>
                        <td className="py-3 px-4 text-center text-cyan-400 font-bold">
                          {node.uptimeShield ? `${node.uptimeShield.toFixed(1)}%` : "100.0%"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/citizen/portal?uid=${node.uid}`}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 transition"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}