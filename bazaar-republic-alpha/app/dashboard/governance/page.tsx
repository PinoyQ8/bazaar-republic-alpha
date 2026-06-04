import { NextResponse } from 'next/server';
// 🛡️ MESH ALIGNED: Must use the gateway to trigger the Build-Time Mute
import { prisma } from "@/lib/mesh-prisma"; 
import ProposalCard from "./ProposalCard";

// 🛡️ NEO PROTOCOL: Hard-lock to dynamic execution
// This prevents Next.js from pre-rendering this page and triggering the constructor.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchInternalProposals() {
  try {
    // 🛡️ MESH QUERY: Relational pull through the proxy
    return await prisma.internalProposal.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: { votes: true },
        },
      },
    });
  } catch (error) {
    console.error("[VAULT FRACTURE] Failed to sync governance data:", error);
    return [];
  }
}

export default async function GovernanceDashboard() {
  const proposals = await fetchInternalProposals();

  return (
    <div className="p-6 bg-black min-h-screen text-white font-mono">
      {/* Sector Header */}
      <div className="border-b border-gray-800 pb-4 mb-8">
        <h1 className="text-2xl font-bold tracking-widest text-green-500 uppercase">
          // LAYER 01: MESH DAO GOVERNANCE
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Staked Core voting module. Active proposals require threshold weight resolution.
        </p>
      </div>

      {/* Grid Blueprint */}
      {proposals.length === 0 ? (
        <div className="border border-dashed border-green-900 p-8 text-center text-green-700 rounded-md bg-black shadow-[0_0_10px_rgba(0,255,0,0.1)]">
          [ ⚠️ ] NO PROPOSALS FOUND IN THE MESH CLUSTER. BUILD SECTOR IS EMPTY.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.map((proposal: any) => (
            <ProposalCard 
              key={proposal.id} 
              proposal={{
                id: proposal.id,
                title: proposal.title,
                description: proposal.description,
                requiredWeight: 1000,
                status: proposal.status,
                // 🛡️ COMPILER SHIELD: Safe access to relational count
                voteCount: proposal._count?.votes || 0 
              }} 
            />
          ))}
        </div>
      )}
    </div>
  );
}