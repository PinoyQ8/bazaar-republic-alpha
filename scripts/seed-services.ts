import { prisma } from "@/lib/prisma";

const coreServices = [
  {
    serviceId: "openclaw-ai",
    name: "OpenClaw AI Gateway",
    description: "Sandboxed AI ingress bridge for DePIN node operations",
    isEnabled: true,
  },
  {
    serviceId: "atlassian-mcp",
    name: "Atlassian MCP Bridge",
    description: "Jira and Confluence Model Context Protocol integration",
    isEnabled: true,
  },
];

async function seedNodeServices() {
  console.log("âš¡ [SEED] Synchronizing NodeService switchboard into MongoDB...");

  for (const service of coreServices) {
    const res = await prisma.nodeService.upsert({
      where: { serviceId: service.serviceId },
      update: {
        name: service.name,
        description: service.description,
        isEnabled: service.isEnabled,
      },
      create: {
        serviceId: service.serviceId,
        name: service.name,
        description: service.description,
        isEnabled: service.isEnabled,
      },
    });
    console.log(`   âœ” Anchored service: ${res.serviceId} (enabled: ${res.isEnabled})`);
  }

  console.log("âœ… Node services switchboard successfully seeded.");
}

seedNodeServices()
  .catch((err) => {
    console.error("âŒ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
