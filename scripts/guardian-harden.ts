import { 
  Horizon, 
  Keypair, 
  TransactionBuilder, 
  Operation, 
  Asset, 
  TimeoutInfinite 
} from '@stellar/stellar-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

// --- CONFIGURATION ---
const HORIZON_URL = process.env.PI_HORIZON_URL || 'https://api.testnet.minepi.com';
const NETWORK_PASSPHRASE = process.env.PI_NETWORK_PASSPHRASE || 'Pi Testnet';
const SHIELD_FEE = '100000'; // 0.01 Pi (100,000 stroops) to clear network inclusion floor

// Keys loaded via CLI arguments or environment variables
const COMPROMISED_SECRET = process.argv[2] || process.env.COMPROMISED_SECRET_KEY;
const GUARDIAN_SECRET = process.argv[3] || process.env.GUARDIAN_SECRET_KEY;
const RECOVERY_VAULT_PUBLIC = process.argv[4] || process.env.RECOVERY_VAULT_PUBLIC_KEY;

const server = new Horizon.Server(HORIZON_URL);

async function runGuardianShield() {
  console.log('='.repeat(65));
  console.log('🛡️  RFC-002: L1 ANTI-SWEEPER SHIELD & EMERGENCY RECOVERY CLI');
  console.log('='.repeat(65));

  if (!COMPROMISED_SECRET || !GUARDIAN_SECRET || !RECOVERY_VAULT_PUBLIC) {
    console.error('❌ Error: Missing required credentials.');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/guardian-harden.ts <COMPROMISED_SKEY> <GUARDIAN_SKEY> <VAULT_PUBKEY>');
    console.log('\nOr configure .env with:');
    console.log('  COMPROMISED_SECRET_KEY=S...');
    console.log('  GUARDIAN_SECRET_KEY=S...');
    console.log('  RECOVERY_VAULT_PUBLIC_KEY=G...\n');
    return;
  }

  const compromisedKeypair = Keypair.fromSecret(COMPROMISED_SECRET.trim());
  const guardianKeypair = Keypair.fromSecret(GUARDIAN_SECRET.trim());
  const compromisedPub = compromisedKeypair.publicKey();
  const guardianPub = guardianKeypair.publicKey();

  console.log(`[TARGET ACCOUNT]   : ${compromisedPub}`);
  console.log(`[GUARDIAN SIGNER]  : ${guardianPub}`);
  console.log(`[RECOVERY VAULT]   : ${RECOVERY_VAULT_PUBLIC}\n`);

  try {
    // -------------------------------------------------------------------------
    // STEP 1: PRE-FLIGHT AUDIT
    // -------------------------------------------------------------------------
    console.log('🔍 [STEP 1/4] Running pre-flight account telemetry audit...');
    const account = await server.loadAccount(compromisedPub);

    const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
    const availablePi = nativeBalance ? parseFloat(nativeBalance.balance) : 0;
    console.log(`   Balance: ${availablePi} Pi | Signers Count: ${account.signers.length}`);
    console.log(`   Thresholds: Low=${account.thresholds.low_threshold}, Med=${account.thresholds.med_threshold}, High=${account.thresholds.high_threshold}`);

    const existingGuardian = account.signers.find((s: any) => s.key === guardianPub);

    // -------------------------------------------------------------------------
    // STEP 2: ESCALATE THRESHOLDS & ATTACH GUARDIAN SIGNER (SetOptions)
    // -------------------------------------------------------------------------
    console.log('\n🔒 [STEP 2/4] Arming shield: Attaching Guardian & escalating thresholds to 2-of-2...');

    if (account.thresholds.med_threshold >= 2 && existingGuardian) {
      console.log('   ℹ️ Thresholds already escalated to 2-of-2. Single-sig bots already blocked.');
    } else {
      const armTx = new TransactionBuilder(account, {
        fee: SHIELD_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.setOptions({
            signer: {
              ed25519PublicKey: guardianPub,
              weight: 1,
            },
            masterWeight: 1,
            lowThreshold: 2,
            medThreshold: 2,
            highThreshold: 2,
          })
        )
        .setTimeout(TimeoutInfinite)
        .build();

      armTx.sign(compromisedKeypair);

      const armResult = await server.submitTransaction(armTx);
      console.log(`   ✅ Shield Armed! Bot single-sig disabled (op_bad_auth enforced).`);
      console.log(`   TxHash: ${armResult.hash}`);
    }

    // -------------------------------------------------------------------------
    // STEP 3: ATOMIC 2-OF-2 CO-SIGNED SWEEP
    // -------------------------------------------------------------------------
    console.log('\n💸 [STEP 3/4] Initiating 2-of-2 dual-signed asset evacuation...');
    const refreshedAccount = await server.loadAccount(compromisedPub);
    const refreshedBalance = parseFloat(
      refreshedAccount.balances.find((b: any) => b.asset_type === 'native')?.balance || '0'
    );

    // Reserve 1.5 Pi for network base reserves (1 Pi base + 0.5 Pi for 2nd signer)
    const sweepAmount = (refreshedBalance - 1.5).toFixed(6);

    if (parseFloat(sweepAmount) > 0.01) {
      console.log(`   Sweeping ${sweepAmount} Pi to Recovery Vault: ${RECOVERY_VAULT_PUBLIC}...`);

      // Check if the recovery vault exists on-chain
      let destinationExists = false;
      try {
        await server.loadAccount(RECOVERY_VAULT_PUBLIC);
        destinationExists = true;
      } catch {
        destinationExists = false;
      }

      const sweepOp = destinationExists
        ? Operation.payment({
            destination: RECOVERY_VAULT_PUBLIC,
            asset: Asset.native(),
            amount: sweepAmount.toString(),
          })
        : Operation.createAccount({
            destination: RECOVERY_VAULT_PUBLIC,
            startingBalance: sweepAmount.toString(),
          });

      console.log(`   Operation Type: ${destinationExists ? 'PAYMENT' : 'CREATE_ACCOUNT'}`);

      const sweepTx = new TransactionBuilder(refreshedAccount, {
        fee: SHIELD_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(sweepOp)
        .setTimeout(TimeoutInfinite)
        .build();

      // Dual signing requirement: Compromised Key + Guardian Key
      sweepTx.sign(compromisedKeypair);
      sweepTx.sign(guardianKeypair);

      const sweepResult = await server.submitTransaction(sweepTx);
      console.log(`   ✅ Liquidity Safely Evacuated!`);
      console.log(`   TxHash: ${sweepResult.hash}`);
    } else {
      console.log('   ℹ️ No liquid balance above reserve to sweep at this time.');
    }

    // -------------------------------------------------------------------------
    // STEP 4: PERMANENT MASTER KEY REVOCATION (Optional/Final Step)
    // -------------------------------------------------------------------------
    console.log('\n🚫 [STEP 4/4] Revocation Check (Master Weight 0)...');

    if (process.argv.includes('--revoke-master')) {
      console.log('   ⚠️ REVOKING MASTER KEY (masterWeight: 0)...');
      const latestAccount = await server.loadAccount(compromisedPub);

      const revokeTx = new TransactionBuilder(latestAccount, {
        fee: SHIELD_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.setOptions({
            masterWeight: 0,
            lowThreshold: 1,
            medThreshold: 1,
            highThreshold: 1,
          })
        )
        .setTimeout(TimeoutInfinite)
        .build();

      revokeTx.sign(compromisedKeypair);
      revokeTx.sign(guardianKeypair);

      const revokeResult = await server.submitTransaction(revokeTx);
      console.log(`   🛑 Compromised master key permanently deactivated!`);
      console.log(`   TxHash: ${revokeResult.hash}`);
    } else {
      console.log('   ℹ️ Master key remains active. To revoke the 24-word seed phrase after all');
      console.log('      locked migrations mature, re-run with "--revoke-master".\n');
    }

    console.log('='.repeat(65));
    console.log('🛡️  RFC-002 RECOVERY SEQUENCE COMPLETE');
    console.log('='.repeat(65));

  } catch (error: any) {
    const horizonError = error?.response?.data?.extras?.result_codes;
    console.error('\n🚨 SEQUENCE FRACTURE:');
    if (horizonError) {
      console.error('Horizon Result Codes:', JSON.stringify(horizonError, null, 2));
    } else {
      console.error(error.message || error);
    }
  }
}

runGuardianShield();