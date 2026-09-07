import { PrismaClient } from "bzr-db";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [BAZAAR-SEED] Starting Virtual Marketplace Service Provider Seeding...");

  // Cast prisma to any to allow dynamic collection checks
  const db = prisma as any;

  if (!db.serviceProvider) {
    throw new Error(
      "❌ Database Error: 'serviceProvider' model was not found in the compiled Prisma Client types.\n" +
      "👉 Please verify that 'model ServiceProvider' exists in your 'prisma/schema.prisma' and that you ran 'npx prisma generate'."
    );
  }

  // Define catalog path
  const catalogPath = path.join(__dirname, "virtual-store-catalog.json");
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`❌ Catalog file not found at: ${catalogPath}`);
  }

  const catalogRaw = fs.readFileSync(catalogPath, "utf8");
  const catalog = JSON.parse(catalogRaw);

  const categoriesToSeed = ["CAFETERIA", "BAKERY", "PHARMACY", "DRY_MARKET", "WET_MARKET"];

  console.log(`🧹 Clearing existing virtual marketplace service providers in categories: ${categoriesToSeed.join(", ")}...`);
  const deleteResult = await db.serviceProvider.deleteMany({
    where: {
      category: { in: categoriesToSeed }
    }
  });
  console.log(`✅ Cleared ${deleteResult.count} stale service providers.`);

  let totalSeeded = 0;

  for (const cat of catalog.categories) {
    console.log(`\n📂 Seeding Category: ${cat.name} (${cat.id})`);
    
    for (const stall of cat.stalls) {
      // Convert baseFeePi to mbzrRate (1 Pi = 1,000 mBZR peg)
      const mbzrRate = parseFloat((stall.baseFeePi * 1000).toFixed(1));

      console.log(`  🛒 Adding Store: "${stall.businessName}" | Managed by: ${stall.providerUid} | Rate: ${mbzrRate} mBZR`);

      const created = await db.serviceProvider.create({
        data: {
          businessName: stall.businessName,
          category: cat.id,
          description: stall.description,
          providerUid: stall.providerUid,
          sectorLocation: stall.sectorLocation,
          mbzrRate: mbzrRate,
          unitLabel: "order",
          isVerified: true,
          totalSettlements: 0,
          rating: stall.rating,
        }
      });

      console.log(`    ✓ Created ServiceProvider document: ObjectId("${created.id}")`);
      totalSeeded++;
    }
  }

  console.log(`\n🎉 [BAZAAR-SEED] Success! Seeded ${totalSeeded} service providers in MongoDB!`);
}

main()
  .catch((e) => {
    console.error("❌ Fatal Seeding Failure:", e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
