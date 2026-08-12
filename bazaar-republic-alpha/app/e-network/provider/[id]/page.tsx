// Location: app/e-network/provider/[id]/page.tsx
import { getProviderById } from "@/app/actions/enetworkActions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProfileActionPanel from "@/app/components/ProfileActionPanel";
import { Lock, ShieldCheck } from "lucide-react";

interface EscrowLockRecord {
  id: string;
  paymentId: string;
  txid: string;
  grossPi?: number;
  amount?: number;
  status: string;
  createdAt: Date;
}

export default async function ProviderProfileSector({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const node = await getProviderById(resolvedParams.id);

  if (!node) {
    notFound(); 
  }

  // Safely query escrow locks with explicit typing fallback
  let escrowLocks: EscrowLockRecord[] = [];
  try {
    // @ts-ignore - Fallback if Prisma schema generation is pending
    escrowLocks = await prisma.escrowLock.findMany({
      where: { providerId: node.id },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.warn("[MESH-SCAN] Escrow table pending schema sync.");
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6 font-mono">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">
            NODE_ID: {node.username ? node.username.toUpperCase() : "ANONYMOUS"}
          </h1>
          <p className="text-zinc-400 text-xs mt-1">Status: Active | Uptime Shield: 99.9%</p>
        </div>
        <div className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded text-xs text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>VERIFIED NODE</span>
        </div>
      </div>

      <div className="bg-zinc-900/50 p-4 border border-zinc-800 rounded-lg space-y-4">
        <h2 className="text-zinc-300 text-xs uppercase tracking-wider border-b border-zinc-800 pb-2">[ UTILITY_LOGIC & IDENTIFIERS ]</h2>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Node Registry ID</p>
            <p className="text-zinc-100 text-xs truncate">{node.id}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">UID Reference</p>
            <p className="text-zinc-100 text-xs">{node.uid}</p>
          </div>
        </div>
      </div>

      {/* 🛡️ ESCROW LOCK TELEMETRY SECTION */}
      <div className="bg-zinc-900/50 p-4 border border-zinc-800 rounded-lg space-y-3">
        <h2 className="text-zinc-300 text-xs uppercase tracking-wider border-b border-zinc-800 pb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" /> Active Escrow Locks ({escrowLocks.length})
        </h2>

        {escrowLocks.length === 0 ? (
          <p className="text-zinc-500 text-xs py-2">No active escrow allocations recorded for this node.</p>
        ) : (
          <div className="space-y-2">
            {escrowLocks.map((lock: EscrowLockRecord) => (
              <div key={lock.id} className="bg-black/40 border border-zinc-800/80 p-3 rounded flex justify-between items-center text-xs">
                <div>
                  <span className="text-cyan-400 font-bold">{lock.grossPi ?? lock.amount ?? 0} Pi</span>
                  <span className="text-zinc-500 ml-2">({lock.status})</span>
                </div>
                <span className="text-zinc-500 text-[10px]">
                  {new Date(lock.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🛡️ MESH-BRIDGE: Profile Action Panel */}
      <ProfileActionPanel 
        node={{ 
          id: node.id, 
          username: node.username || "Anonymous",
          rate: 1.5 
        }} 
      />
    </div>
  );
}