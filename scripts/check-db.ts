import prisma from '../lib/prisma';

async function main() {
  const accounts = await prisma.shieldAccount.findMany({
    include: {
      recoveries: true,
      events: true,
    },
  });

  console.log('--- Shield Accounts in MongoDB ---');
  console.dir(accounts, { depth: null, colors: true });

  const ledgerEntries = await prisma.meshLedger.findMany({
    where: { txType: 'SHIELD_SWEEP' },
  });

  console.log('--- Mesh Ledger Sweep Settlements ---');
  console.dir(ledgerEntries, { depth: null, colors: true });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());