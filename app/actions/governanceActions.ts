// Location: app/actions/governanceActions.ts
"use server";

import { prisma } from "@/lib/prisma";

export async function submitProposal({
  title,
  description,
  authorUid,
}: {
  title: string;
  description: string;
  authorUid: string;
}) {
  try {
    const proposal = await (prisma as any).internalProposal.create({
  data: {
    title,
    description,
    authorUid,
    status: "ACTIVE",
    votesFor: 0,
    votesAgainst: 0,
  },
});

    return { success: true, proposal };
  } catch (error: any) {
    console.error("[GOVERNANCE_ACTION_ERROR]:", error);
    return { success: false, error: error.message };
  }
}