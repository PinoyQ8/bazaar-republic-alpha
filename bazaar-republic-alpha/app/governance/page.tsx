// 🛡️ MESH UI: Governance Node (Server-Side Injection)
import GovernanceDashboard from "../components/GovernanceDashboard";
import { getConsensusData } from "../actions/governance";

export default async function GovernancePage() {
  // Fetch the ledger data directly on the server
  const data = await getConsensusData();

  // If we have no data, handle the empty state at the root level
  if (!data || !data.proposal) {
    return (
      <main className="min-h-screen bg-black text-gray-100 font-mono p-8">
        <h1 className="text-xl text-yellow-500">MESH-SCAN: Ledger Empty</h1>
        <p>No active proposals found in the Genesis cluster.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-gray-100 font-mono">
      {/* Inject the ledger data into the client component */}
      <GovernanceDashboard data={data} />
    </main>
  );
}