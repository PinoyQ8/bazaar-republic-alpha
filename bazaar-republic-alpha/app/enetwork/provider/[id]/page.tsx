// app/enetwork/provider/[id]/page.tsx
import { getProviderById } from "@/app/actions/enetworkActions";
import { notFound } from "next/navigation";
import ProfileActionPanel from "@/app/components/ProfileActionPanel";

export default async function ProviderProfileSector({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const node = await getProviderById(resolvedParams.id);

  if (!node) {
    notFound(); 
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400 font-mono">
           NODE_ID: {node.username!.toUpperCase()}
          </h1>
          {/* Removed non-existent node.tier */}
          <p className="text-zinc-400 text-sm mt-1">Status: Active | Uptime Shield: 99.9%</p>
        </div>
      </div>

      <div className="bg-zinc-900/50 p-4 border border-zinc-800 rounded-lg">
        <h2 className="text-zinc-300 font-mono text-sm mb-4 border-b border-zinc-800 pb-2">[ UTILITY_LOGIC ]</h2>
        <div className="space-y-3">
          {/* Removed non-existent node.service, node.description, and node.rate */}
          <div>
            <p className="text-xs text-zinc-500">Node Identifier</p>
            <p className="text-zinc-100 font-medium font-mono">{node.id}</p>
          </div>
        </div>
      </div>

      {/* 🛡️ MESH-BRIDGE: Injecting placeholder to satisfy ProviderNode */}
      <ProfileActionPanel 
        node={{ 
          id: node.id, 
          username: node.username!,
          rate: 0 // Placeholder until the schema is expanded
        }} 
      />
    </div>
  );
}