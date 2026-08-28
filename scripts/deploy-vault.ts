// 🛡️ PROJECT BAZAAR DAO - PROTOCOL 28
// AUTOMATED SOROBAN VAULT DEPLOYMENT & AUTO-WIRING SCRIPT

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 🛡️ ESM __dirname equivalent compatibility mapping
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deployVault() {
  console.log('🚀 [Deployer] Starting Automated Bazaar Vault Deployment...');

  const rootDir = path.resolve(__dirname, '..'); // bazaar-republic-alpha
  const macroRootDir = path.resolve(rootDir, '..'); // bazaar-republic (Macro Workspace Root)
  const contractDir = path.join(rootDir, 'contracts', 'bazaar-vault');
  
  const rootCargo = path.join(macroRootDir, 'Cargo.toml');
  const rootCargoBak = path.join(macroRootDir, 'Cargo.toml.bak');
  const genesisCargo = path.join(macroRootDir, 'bazaar-genesis-ledger', 'Cargo.toml');
  const genesisCargoBak = genesisCargo + '.bak';
  const daoCargo = path.join(rootDir, 'app', 'dao', 'contracts', 'Cargo.toml');
  const daoCargoBak = daoCargo + '.bak';

  try {
    // 1. Temporarily neutralize competing macro workspace manifests to prevent Cargo collisions
    if (fs.existsSync(rootCargo)) fs.renameSync(rootCargo, rootCargoBak);
    if (fs.existsSync(genesisCargo)) fs.renameSync(genesisCargo, genesisCargoBak);
    if (fs.existsSync(daoCargo)) fs.renameSync(daoCargo, daoCargoBak);

    console.log('🔨 Building optimized Soroban contract (wasm32v1-none)...');
    execSync('stellar contract build', { cwd: contractDir, stdio: 'inherit' });

    console.log('📡 Deploying contract to Stellar Testnet via s23-deployer...');
    const deployOutput = execSync(
      'stellar contract deploy --wasm target/wasm32v1-none/release/bazaar_vault.wasm --source s23-deployer --network testnet',
      { cwd: contractDir, encoding: 'utf-8' }
    );

    console.log(deployOutput);

    // 2. Parse the deployed Contract ID (matches Stellar 56-character C-address format)
    const match = deployOutput.match(/C[A-Z2-7]{55}/);
    if (!match) {
      throw new Error('Failed to parse deployed Contract ID from deployment output.');
    }

    const contractId = match[0];
    console.log(`✅ Successfully Deployed Contract ID: ${contractId}`);

    // 3. Automatically update .env.local
    const envPath = path.join(rootDir, '.env.local');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
    if (envContent.includes('NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID=')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID=.*/g,
        `NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID=${contractId}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID=${contractId}\n`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log('📝 Updated .env.local with new Contract ID.');

    // 4. Automatically update scripts/test-e2e-escrow.ts
    const e2eScriptPath = path.join(rootDir, 'scripts', 'test-e2e-escrow.ts');
    if (fs.existsSync(e2eScriptPath)) {
      let scriptContent = fs.readFileSync(e2eScriptPath, 'utf-8');
      scriptContent = scriptContent.replace(
        /const TARGET_CONTRACT_ID = ".*";/,
        `const TARGET_CONTRACT_ID = "${contractId}";`
      );
      fs.writeFileSync(e2eScriptPath, scriptContent);
      console.log('📝 Updated scripts/test-e2e-escrow.ts with new Contract ID.');
    }

    console.log('🎉 Deployment and auto-wiring completed successfully!');
  } catch (error) {
    console.error('❌ Deployment pipeline failed:', error);
  } finally {
    // 5. Restore all workspace manifest files regardless of success/failure
    if (fs.existsSync(rootCargoBak)) fs.renameSync(rootCargoBak, rootCargo);
    if (fs.existsSync(genesisCargoBak)) fs.renameSync(genesisCargoBak, genesisCargo);
    if (fs.existsSync(daoCargoBak)) fs.renameSync(daoCargoBak, daoCargo);
    console.log('🧹 Restored workspace configuration files.');
  }
}

deployVault();