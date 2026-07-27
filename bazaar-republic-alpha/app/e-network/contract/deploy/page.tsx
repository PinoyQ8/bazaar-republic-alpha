import Link from "next/link";

type DeploySearchParams = {
  providerId?: string;
  rate?: string;
  name?: string;
};

export default async function ContractDeploymentSector({
  searchParams,
}: {
  searchParams: Promise<DeploySearchParams>;
}) {
  // 1. 🛡️ NEXT.JS 15+ PROMISE UNWRAP: Safely intercept query parameters
  const resolvedParams = await searchParams;
  
  const providerId = resolvedParams.providerId || "UNKNOWN_NODE";
  const providerName = resolvedParams.name || "Unknown Provider";
  const baseRate = resolvedParams.rate || "0";

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* HEADER */}
      <div className="pb-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-emerald-400 font-mono tracking-wide">
          [ DEPLOY_SMART_CONTRACT ]
        </h1>
        <p className="text-zinc-400 text-xs mt-1">
          Establishing peer-to-peer escrow channel inside the E-Network.
        </p>
      </div>

      {/* TARGET AMBIENT LOGIC */}
      <div className="bg-zinc-900/40 p-4 border border-zinc-800 rounded-lg space-y-2 text-sm font-mono">
        <div className="flex justify-between">
          <span className="text-zinc-500">Target Node:</span>
          <span className="text-zinc-200 font-bold">{providerName.toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Registry ID:</span>
          <span className="text-zinc-400 text-xs">{providerId}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-zinc-800/60">
          <span className="text-zinc-500">Locked Rate:</span>
          <span className="text-emerald-400 font-bold">{baseRate} Pi / hr</span>
        </div>
      </div>

      {/* DEPLOYMENT FORM */}
      <form className="space-y-4">
        {/* Hidden parameters to preserve state on submission */}
        <input type="hidden" name="providerId" value={providerId} />
        <input type="hidden" name="rate" value={baseRate} />

        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">
            Task Definition / Scope of Work
          </label>
          <textarea
            required
            rows={4}
            name="taskScope"
            placeholder="Describe the operations this node must execute (e.g., Compute matrix analysis, API proxy load testing)..."
            className="w-full bg-black text-zinc-100 border border-zinc-800 rounded p-3 text-sm focus:outline-none focus:border-emerald-500 font-mono transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">
            Escrow Allocation (Estimated Hours)
          </label>
          <input
            type="number"
            required
            min={1}
            name="estimatedHours"
            placeholder="Minimum 1 hour"
            className="w-full bg-black text-zinc-100 border border-zinc-800 rounded p-3 text-sm focus:outline-none focus:border-emerald-500 font-mono transition-colors"
          />
        </div>

        <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded text-xs text-zinc-500 leading-relaxed font-mono">
          <span className="text-amber-500 font-bold">⚠️ SECURITY NOTICE:</span> Allocating funds locks the specified Pi equivalent into the DAO Escrow contract. Capital will release progressively as milestones are cryptographically signed by both nodes.
        </div>

        {/* INTERACTION HUB */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-3 px-4 rounded transition-colors uppercase tracking-wider font-mono text-sm"
          >
            Sign & Broadcast Agreement
          </button>
          
          <Link
            href={`/e-network/provider/${providerId}`}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-center font-bold py-3 px-4 rounded transition-colors uppercase tracking-wider font-mono text-sm"
          >
            Abort Handshake
          </Link>
        </div>
      </form>

    </div>
  );
}