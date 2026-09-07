import { PrismaClient } from "../prisma/generated/client";

const prisma = new PrismaClient();

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
  console.log("⚡ [SEED] Synchronizing NodeService switchboard into MongoDB...");

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
    console.log(`   ✔ Anchored service: ${res.serviceId} (enabled: ${res.isEnabled})`);
  }

  console.log("✅ Node services switchboard successfully seeded.");
}

seedNodeServices()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });