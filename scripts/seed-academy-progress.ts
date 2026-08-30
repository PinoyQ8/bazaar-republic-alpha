// Location: scripts/seed-academy-progress.ts
import { PrismaClient } from @/lib/db;

const prisma = new PrismaClient();

async function main() {
  console.log('🎓 Seeding Academy Module logs for the 50 Genesis Nodes...');
  const db = prisma as any;

  // Clean old academy logs
  if (db.academyLog) await db.academyLog.deleteMany({});

  const modules = ['MODULE_01', 'MODULE_02', 'MODULE_03'];

  // Simulate staggered module clearances across the 50 nodes
  for (let i = 1; i <= 50; i++) {
    const uid = `usr_pioneer_${1000 + i}`;
    
    // Stagger completion count:
    // Nodes 1-10: 3 modules (Genesis Elder candidate)
    // Nodes 11-25: 2 modules (Mesh Validator candidate)
    // Nodes 26-40: 1 module (Eco Developer candidate)
    // Nodes 41-50: 0 modules (Cadet Initiate)
    let completedCount = 0;
    if (i <= 10) completedCount = 3;
    else if (i <= 25) completedCount = 2;
    else if (i <= 40) completedCount = 1;

    for (let m = 0; m < completedCount; m++) {
      await db.academyLog.create({
        data: {
          pioneerUid: uid,
          moduleKey: modules[m],
          status: 'COMPLETED',
          createdAt: new Date(Date.now() - (3 - m) * 86400000),
        },
      });
    }
  }

  console.log('✅ Academy Progress Seeded successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Failed to seed academy logs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });