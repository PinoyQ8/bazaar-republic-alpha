// app/governance/page.tsx
import GovernanceDashboard from "../components/GovernanceDashboard";
import { getConsensusData } from "../actions/governance";

// 🛡️ MESH DIRECTIVE: Bypasses static pre-rendering (Prevents ECONNREFUSED)
export const dynamic = 'force-dynamic';

export default async function GovernancePage() {
  // Fetch the ledger data directly on the server
  const data = await getConsensusData();

  // If we have no data, handle the empty state at the root level
  if (!data || !data.proposal) {
    return (
      // 🛡️ BAZAAR TECH: Aligned with the Dark-Core aesthetic (neutral-950/amber-500)
      <main className="min-h-screen bg-neutral-950 text-slate-300 font-mono p-8 flex flex-col items-center justify-center">
        <div className="border border-amber-900/50 p-6 rounded bg-neutral-900/50 w-full max-w-bazaar-node text-center">
          <h1 className="text-xl text-amber-500 mb-2">[MESH-SCAN] Ledger Empty</h1>
          <p className="text-slate-400 text-sm">No active proposals found in the Genesis cluster.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-slate-300 font-mono">
      {/* Inject the ledger data into the client component */}
      <GovernanceDashboard data={data as any} />
    </main>
  );
}