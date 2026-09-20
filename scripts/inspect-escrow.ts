import { prisma } from '../lib/prisma';

async function main() {
  const db = prisma as any;
  const targetId = '6aaec4a4f34c126fb07b8270';
  
  const rec = await db.escrowLock.findUnique({
    where: { id: targetId }
  }).catch(() => null);

  console.log('====================================');
  console.log('MONGODB ESCROW RECORD:');
  console.log(JSON.stringify(rec, null, 2));
  console.log('====================================');

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
