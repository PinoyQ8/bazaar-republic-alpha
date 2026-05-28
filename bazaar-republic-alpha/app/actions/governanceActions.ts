"use server";

// ENSURE EXPORTS ARE PRESENT
export async function getActiveProposals() {
  return [
    { _id: "mock-prop-001", title: "Activate DEX", description: "...", targetParameter: "DEX_STATUS" }
  ];
}

export async function createProposal(proposerId: string, title: string, description: string, targetParameter: string, proposedValue: number) {
  return { success: true, message: "BALLOT INITIATED" };
}