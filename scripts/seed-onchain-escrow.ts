import { Keypair } from '@stellar/stellar-sdk';
import { bazaarVaultService, SAC_TOKEN_CONTRACT, BAZAAR_VAULT_CONTRACT_ID } from '../services/bazaarVaultService';
import { prisma } from '../lib/prisma';

async function main() {
  const escrowId = 'ESC_UI_123185';
  const consumer = 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3';
  const provider = 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3';
  const amountStroops = 100_000n; // 0.01 PI (10^7 stroops precision)
  const durationSecs = 172800n;   // 48-Hour Timelock

  const secretKey =
    process.env.OPERATOR_STELLAR_SECRET ||
    process.env.STELLAR_VAULT_SEED ||
    process.env.STELLAR_DEPLOYER_SECRET ||
    'SA4F7YV45RRE4HYZ56R3CLL3G2C5B5OQ6EZ23675NPYF2C6N2BZZ7Z6F';

  const signer = Keypair.fromSecret(secretKey.trim());

  console.log(`🔐 Locking '${escrowId}' on canonical contract ${BAZAAR_VAULT_CONTRACT_ID}...`);
  console.log(`🔑 Signer Public Key: ${signer.publicKey()}`);

  // 1. Submit on-chain lock transaction via Protocol 28 contract
  const txRes: any = await bazaarVaultService.lockFunds(
    {
      escrowId,
      tokenContract: SAC_TOKEN_CONTRACT,
      consumerAddress: consumer,
      providerAddress: provider,
      amount: amountStroops,
      durationSecs,
    },
    signer
  );

  console.log(`✅ Locked on-chain! Tx Hash: ${txRes?.hash || txRes?.txHash || 'CONFIRMED'}`);

  // 2. Verify on-chain record via get_vault
  console.log(`🔍 Verifying get_vault('${escrowId}')...`);
  const vault = await bazaarVaultService.getVault(escrowId);
  console.log('📦 Live On-Chain Vault Record:', JSON.stringify(vault, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));

  // 3. Ensure MongoDB escrowLock is synchronized
  const db = prisma as any;
  if (db.escrowLock) {
    await db.escrowLock.upsert({
      where: { escrowId },
      update: {
        status: 'LOCKED',
        txid: txRes?.hash || txRes?.txHash || 'ON_CHAIN_LOCKED',
        updatedAt: new Date()
      },
      create: {
        escrowId,
        consumerUid: consumer,
        providerId: '65f1a2b3c4d5e6f7a8b9c0d1',
        amount: 0.01,
        token: 'PI',
        status: 'LOCKED',
        txid: txRes?.hash || txRes?.txHash || 'ON_CHAIN_LOCKED',
        timelockExpiresAt: new Date(Date.now() + 172800000),
        serviceDescription: 'Live Pipeline Verification Test'
      }
    });
    console.log('✅ Local MongoDB synchronized: ESC_UI_123185 -> LOCKED');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Lock failed:', err?.message || err);
  process.exit(1);
});
