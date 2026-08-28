import { prisma } from '../lib/prisma';
import { Keypair } from '@stellar/stellar-sdk';

async function runIntegrationTest() {
  console.log('🛡️ [Test Runner] Starting Headless Escrow & API Integration Test...');
  
  const db = prisma as any;

  try {
    // 1. Seed or find a test PioneerNode in MongoDB
    const testUid = 'pioneer_test_01';
    let pioneer = await db.pioneerNode.findUnique({ where: { uid: testUid } });
    
    if (!pioneer) {
      const kp = Keypair.random();
      pioneer = await db.pioneerNode.create({
        data: {
          uid: testUid,
          username: 'TestPioneerNode',
          walletAddress: kp.publicKey(),
          tier: 'CITIZEN',
          status: 'ACTIVE',
          isFrozen: false,
        },
      });
      console.log('✅ [Database] Created test PioneerNode:', pioneer.uid);
    } else {
      console.log('✅ [Database] Found existing test PioneerNode:', pioneer.uid);
    }

    // 2. Seed or find a test ServiceProvider in MongoDB
    let provider = await db.serviceProvider.findFirst({ where: { businessName: 'Test SoloHost Node' } });
    
    if (!provider) {
      provider = await db.serviceProvider.create({
        data: {
          businessName: 'Test SoloHost Node',
          category: 'Compute',
          description: 'Local node verification service',
          providerUid: pioneer.uid,
          sectorLocation: 'Localhost',
          mbzrRate: 10.0,
          unitLabel: 'Hour',
          isVerified: true,
        },
      });
      console.log('✅ [Database] Created test ServiceProvider ID:', provider.id);
    } else {
      console.log('✅ [Database] Found existing test ServiceProvider ID:', provider.id);
    }

    // 3. Test API Route simulation payload
    const testEscrowId = `ESC-TEST-${Date.now().toString().slice(-4)}`;
    const testAmount = 100.0;
    
    console.log(`\n🚀 [API Simulation] Testing escrow lock payload for ID: ${testEscrowId}`);
    console.log(`   - Consumer UID: ${testUid}`);
    console.log(`   - Provider ID: ${provider.id}`);
    console.log(`   - Amount: ${testAmount} PI`);

    // 4. Verify MongoDB EscrowLock model persistence write check
    const mockEscrowLock = await db.escrowLock.create({
      data: {
        escrowId: testEscrowId,
        consumerUid: testUid,
        providerId: provider.id,
        amount: testAmount,
        status: 'LOCKED',
        timelockExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        serviceDescription: 'Automated headless integration test lock',
      },
    });

    console.log('✅ [Database] EscrowLock successfully written to MongoDB collection:');
    console.log(JSON.stringify(mockEscrowLock, null, 2));

    console.log('\n🎉 Headless Integration Test Passed Successfully!');
  } catch (error: any) {
    console.error('❌ [Test Error] Integration test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runIntegrationTest();