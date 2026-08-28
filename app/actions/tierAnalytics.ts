"use server"; // Ensures strict server-side boundary execution

import { prisma } from "@/lib/prisma";

export async function getPioneerTierDistribution() {
  try {
    const totalNodes = await prisma.pioneerNode.count();

    if (totalNodes === 0) {
      return { totalNodes: 0, distribution: [] };
    }

    const tierGroups = await prisma.pioneerNode.groupBy({
      by: ["tier"],
      _count: {
        tier: true,
      },
    });

    const distribution = tierGroups.map((group) => {
      const count = group._count.tier;
      const percentage = ((count / totalNodes) * 100).toFixed(2);
      return {
        tier: group.tier ?? 0, // Fallback if tier is unassigned/null
        count,
        percentage: `${percentage}%`,
      };
    });

    return {
      totalNodes,
      distribution,
    };
  } catch (error) {
    console.error("❌ [TIER-METRICS] Failed to calculate tier distribution:", error);
    return { totalNodes: 0, distribution: [] };
  }
}