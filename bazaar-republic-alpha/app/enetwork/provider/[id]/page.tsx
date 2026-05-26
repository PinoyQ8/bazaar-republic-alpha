// app/enetwork/provider/[id]/page.tsx

import { getProviderById } from "@/app/actions/enetworkActions";
import { notFound } from "next/navigation";
import ProfileActionPanel from "@/app/components/ProfileActionPanel"; // 🛡️ Inject Client Component

export default async function ProviderProfileSector({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const node = await getProviderById(resolvedParams.id);

  if (!node) {
    notFound(); 
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* HEADER SECTOR */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400 font-mono">
            NODE_ID: {node.username.toUpperCase()}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Tier: {node.tier} | Uptime Shield: 99.9%</p>
        </div>
        <div className="px-3 py-1 bg-emerald-900/30 text-emerald-500 border border-emerald-800 rounded text-xs font-bold tracking-widest">
          {node.status}
        </div>
      </div>

      {/* UTILITY LOGIC SECTOR */}
      <div className="bg-zinc-900/50 p-4 border border-zinc-800 rounded-lg">
        <h2 className="text-zinc-300 font-mono text-sm mb-4 border-b border-zinc-800 pb-2">
          [ UTILITY_LOGIC ]
        </h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-zinc-500">Service Designation</p>
            <p className="text-zinc-100 font-medium">{node.service}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Parameters</p>
            <p className="text-zinc-300">{node.description || "Standard Execution."}</p>
          </div>
          <div className="pt-2">
            <p className="text-xs text-zinc-500">Base Exchange Rate</p>
            <p className="text-xl text-emerald-400 font-bold">{node.rate} <span className="text-sm">Pi / hr</span></p>
          </div>
        </div>
      </div>

      {/* ACTION PROTOCOL */}
      {/* 🛡️ THE SEAMLESS TRANSITION LAYER */}
      <ProfileActionPanel node={{ id: node.id, username: node.username, rate: node.rate }} />

    </div>
  );
}