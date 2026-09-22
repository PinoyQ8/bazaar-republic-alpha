import { Horizon } from '@stellar/stellar-sdk';
import prisma from '../lib/prisma';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const server = new Horizon.Server(process.env.PI_HORIZON_URL || 'https://api.testnet.minepi.com');

async function backfill() {
  const targetPub = 'GCN3PWTGHVJ7HRMBD43THOWZ6KVGLUFIVGGYJDQMFSRJK3CTTTZ5PQJR';
  const guardianPub = 'GCHDMWBWWR6CXRXNIHCUSLMUE3HHUUABEEYJY3C3BM6KSH43DQRCRSPS';
  const vaultPub = 'GB2OSGJYMSUVSRECWDBVEP3F5HQEW2OXFTHPEXRQP2DMBKKVLALSSSRV';

  console.log(`Fetching latest state for ${targetPub}...`);
  const account = await server.loadAccount(targetPub);
  const nativeBal = parseFloat(account.balances.find((b: any) => b.asset_type === 'native')?.balance || '0');

  const shieldDoc = await prisma.shieldAccount.upsert({
    where: { targetAddress: targetPub },
    update: {
      guardianAddress: guardianPub,
      recoveryVault: vaultPub,
      currentBalance: nativeBal,
      masterWeight: 0,
      status: 'NEUTRALIZED_REVOKED',
      lowThreshold: account.thresholds.low_threshold,
      medThreshold: account.thresholds.med_threshold,
      highThreshold: account.thresholds.high_threshold,
    },
    create: {
      targetAddress: targetPub,
      guardianAddress: guardianPub,
      recoveryVault: vaultPub,
      initialBalance: 4.99,
      currentBalance: nativeBal,
      reservedBuffer: 1.6,
      masterWeight: 0,
      status: 'NEUTRALIZED_REVOKED',
      lowThreshold: account.thresholds.low_threshold,
      medThreshold: account.thresholds.med_threshold,
      highThreshold: account.thresholds.high_threshold,
    },
  });

  const settlement = await prisma.recoverySettlement.create({
    data: {
      shieldAccountId: shieldDoc.id,
      evacuatedAmount: 3.39,
      vaultAddress: vaultPub,
      operationType: 'PAYMENT',
      sweepTxHash: 'ON_CHAIN_RECOVERY_TESTNET',
      revokeTxHash: 'ON_CHAIN_NEUTRALIZED_TESTNET',
      settledLedger: account.last_modified_ledger,
    },
  });

  await prisma.meshLedger.create({
    data: {
      walletId: vaultPub,
      txHash: settlement.id,
      txType: 'SHIELD_SWEEP',
      piAmount: 3.39,
      status: 'CONFIRMED',
      description: `RFC-002 Evacuation from ${targetPub.slice(0, 8)}... to cold vault`,
    },
  });

  console.log('✅ Backfill complete!');
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect());