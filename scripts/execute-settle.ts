import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Keypair } from '@stellar/stellar-sdk';

// Explicitly load .env.local
const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');
const envPath = path.join(rootDir, '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let val = (match[2] || '').trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  }
}

async function main() {
  const { bazaarVaultService, BAZAAR_VAULT_CONTRACT_ID } = await import('../services/bazaarVaultService');
  const { prisma } = await import('../lib/prisma');

  const escrowId = 'ESC_UI_123185';
  const consumer = 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3';

  console.log(`🔌 Target Contract : ${BAZAAR_VAULT_CONTRACT_ID}`);
  console.log(`📦 Escrow ID        : ${escrowId}`);

  // 1. Verify On-Chain Vault State
  const vault = await bazaarVaultService.getVault(escrowId);
  console.log('🔍 Current State on Pi Testnet:', vault?.status);

  if (!vault) {
    throw new Error(`Escrow '${escrowId}' not found on Pi Testnet ledger.`);
  }

  // 2. Resolve Signer Key
  const secretKey =
    process.env.OPERATOR_STELLAR_SECRET ||
    process.env.STELLAR_DEPLOYER_SECRET ||
    process.env.STELLAR_VAULT_SEED ||
    '';

  const signer = Keypair.fromSecret(secretKey.trim());
  console.log(`🔑 Signer Public Key: ${signer.publicKey()}`);

  // 3. Broadcast release_funds
  console.log('\n🚀 Broadcasting release_funds to Pi Testnet...');
  const txRes: any = await bazaarVaultService.releaseFunds(escrowId, consumer, signer);
  console.log(`✅ On-Chain Settlement Confirmed! Tx Hash: ${txRes?.hash || txRes?.txHash || 'SETTLED'}`);

  // 4. Verify Final State
  const updatedVault = await bazaarVaultService.getVault(escrowId);
  console.log('📦 Post-Release Ledger Status:', updatedVault?.status);

  // 5. Update MongoDB Record
  const db = prisma as any;
  if (db.escrowLock) {
    await db.escrowLock.updateMany({
      where: { escrowId },
      data: {
        status: 'RELEASED',
        txid: txRes?.hash || txRes?.txHash || 'SETTLED_ON_CHAIN',
        updatedAt: new Date(),
      },
    });
    console.log('✅ MongoDB EscrowLock updated to: RELEASED');
  }
}

main().catch(err => {
  console.error('❌ Settlement execution failed:', err?.message || err);
});
