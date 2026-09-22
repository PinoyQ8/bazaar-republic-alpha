import prisma from '../lib/prisma';

async function main() {
  const updated = await prisma.meshLedger.updateMany({
    where: { txSignature: null },
    data: { txSignature: 'LEGACY_BACKFILL_6ab283d3cc326134106a42f7' },
  });
  console.log(`✅ Patched ${updated.count} legacy MeshLedger records.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());