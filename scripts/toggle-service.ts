import { prisma } from "../lib/prisma";

async function toggleService() {
  const action = process.argv[2]?.toLowerCase();
  const serviceId = process.argv[3] || "openclaw-ai";
  const isEnabled = action === "enable";

  console.log(`⚙️ Toggling service '${serviceId}' -> isEnabled: ${isEnabled}...`);

  // Execute raw MongoDB update to bypass Prisma model schema validation
  await prisma.$runCommandRaw({
    update: "NodeService",
    updates: [
      {
        q: { serviceId },
        u: {
          $set: {
            serviceId,
            isEnabled,
            updatedAt: new Date().toISOString(),
          },
          $setOnInsert: {
            name: serviceId === "openclaw-ai" ? "OpenClaw AI Worker" : "Atlassian MCP Bridge",
            createdAt: new Date().toISOString(),
          },
        },
        upsert: true,
      },
    ],
  });

  console.log(`✔ Service '${serviceId}' is now ${isEnabled ? "ENABLED (200)" : "PAUSED (503)"}.`);
}

toggleService()
  .catch((err) => {
    console.error("❌ Failed to update service switch state:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });