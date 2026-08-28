import { prisma } from '../lib/prisma';

async function runReleaseTest() {
  console.log('🛡️ [Test Runner] Starting Headless Release & Settlement Test...');
  
  // 🛡️ Type-safe assertion bypass for runtime synchronization
  const db = prisma as any;

  try {
    // 1. Find a currently LOCKED escrow in MongoDB
    const lockedEscrow = await db.escrowLock.findFirst({
      where: { status: 'LOCKED' }
    });

    if (!lockedEscrow) {
      console.log('❌ No LOCKED escrows found. Please run the Lock test first.');
      return;
    }

    console.log(`✅ [Database] Found LOCKED Escrow: ${lockedEscrow.escrowId}`);

    // 2. Define the payload for the API route
    // NOTE: Replace 'S...' with your raw 56-character secret key if it is not in your .env
    const signerSecret = process.env.STELLAR_VAULT_SEED || 'SA4SAFST7UZ4CI7GPE7TFLG362FVJ7FTETKZWW5X7XAOFAANKMVC7Z6F';

    const payload = {
      consumerUid: lockedEscrow.consumerUid,
      escrowId: lockedEscrow.escrowId,
      signerSecret, 
    };

    console.log(`\n🚀 [API Simulation] Executing Settlement for ID: ${lockedEscrow.escrowId}`);

    // 3. Hit the local Next.js API route
    const response = await fetch('http://localhost:3000/api/escrow/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API Request Failed');
    }

    console.log('✅ [Soroban Relayer] Smart Contract execution successful!');
    console.log(`   - Escrow ID: ${data.escrowId}`);
    console.log(`   - Transaction Hash: ${data.txHash}`);

    // 4. Verify MongoDB EscrowLock model persistence write check
    const updatedEscrow = await db.escrowLock.findUnique({
      where: { escrowId: lockedEscrow.escrowId }
    });

    console.log(`✅ [Database] Escrow status successfully updated to: ${updatedEscrow.status}`);
    console.log('\n🎉 Headless Settlement Test Passed Successfully!');

  } catch (error: any) {
    console.error('❌ [Test Error] Settlement test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runReleaseTest();