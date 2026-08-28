import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ShieldCheck, Server, ArrowLeft, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ENetworkDashboardPage() {
  const db = prisma as any;

  const listings = db.eNetworkListing
    ? await db.eNetworkListing.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  const totalActiveNodes = db.pioneerNode
    ? await db.pioneerNode.count({ where: { status: "ACTIVE" } })
    : 0;

  return (
    <main className="w-full max-w-[384px] mx-auto min-h-dvh bg-slate-950 text-slate-100 p-4 pb-24 font-mono space-y-4">
      <header className="border-b border-zinc-800 pb-3 flex items-center justify-between">
        <Link href="/dashboard" className="text-zinc-400 hover:text-white flex items-center gap-1 text-xs">
          <ArrowLeft size={14} />
          <span>Dashboard</span>
        </Link>
        <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
          E-NETWORK
        </span>
      </header>

      <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3.5 space-y-2">
        <span className="text-[11px] text-zinc-400 font-semibold uppercase flex items-center gap-1.5">
          <Server size={13} className="text-cyan-400" />
          Active Solohost Grid
        </span>
        <div className="text-xl font-bold text-white">{totalActiveNodes} Nodes</div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recent Node Listings</span>
        <div className="space-y-2">
          {listings.length === 0 ? (
            <div className="text-[11px] text-zinc-500 p-3 bg-zinc-900/30 rounded-lg border border-zinc-800/60">
              No active listings currently registered on grid.
            </div>
          ) : (
            listings.map((listing: any) => (
              <div key={listing.id} className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-200">{listing.title}</span>
                  <span className="text-[9px] text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {listing.status}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 line-clamp-2">{listing.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}