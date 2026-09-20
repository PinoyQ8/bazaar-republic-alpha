import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local explicitly into process.env for tsx scripts
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
  const { bazaarVaultService } = await import('../services/bazaarVaultService');

  console.log('🔌 Contract ID :', bazaarVaultService['contract'].contractId());
  console.log('🌐 RPC URL     :', (bazaarVaultService as any).rpcServer?.serverURL.toString());

  const vault = await bazaarVaultService.getVault('ESC_UI_123185');
  console.log('====================================');
  console.log('BAZAAR VAULT SERVICE RESPONSE:');
  console.log(JSON.stringify(vault, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  console.log('====================================');
}

main().catch(err => {
  console.error('❌ Service query failed:', err?.message || err);
});
