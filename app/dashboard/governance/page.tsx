// 🛡️ THE MESH LAW: Route through the Prisma 7 Adapter
   import { neonClient } from "@/lib/neo-client";
import ProposalCard from "./ProposalCard";

// Force Next.js to bypass static caching so new proposals appear instantly
export const revalidate = 0;

async function fetchInternalProposals() {
  try {
    const proposals = await neonClient.internalProposal.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: { votes: true }, // Pulls total vote count efficiently
        },
      },
    });
    return proposals;
  } catch (error) {
    console.error("[MESH FAULT] Failed to fetch governance data:", error);
    return [];
  }
}

export default async function GovernanceDashboard() {
  const proposals = await fetchInternalProposals();

  return (
    <div className="p-6 bg-black min-h-screen text-white font-mono">
      {/* Sector Header */}
      <div className="border-b border-gray-800 pb-4 mb-8">
        <h1 className="text-2xl font-bold tracking-widest text-white uppercase">
          // LAYER 01: INTERNAL DAO GOVERNANCE
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Staked Core voting module. Active proposals require threshold weight resolution.
        </p>
      </div>

      {/* Grid Blueprint */}
      {proposals.length === 0 ? (
        <div className="border border-dashed border-gray-800 p-8 text-center text-gray-500 rounded">
          NO PROPOSALS FOUND IN THE NEON CLUSTER. BUILD SECTOR IS EMPTY.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.map((proposal) => (
            <ProposalCard 
              key={proposal.id} 
              proposal={{
                id: proposal.id,
                title: proposal.title,
                description: proposal.description,
                requiredWeight: proposal.requiredWeight,
                status: proposal.status,
                voteCount: proposal._count.votes
              }} 
            />
          ))}
        </div>
      )}
    </div>
  );
}