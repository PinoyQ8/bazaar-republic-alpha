// Bazaar Republic SRE: Treasury Multisig Lock (v12 Compliant)
require('dotenv').config({ path: '.env.local' });
const StellarSdk = require('stellar-sdk');

// MESH LOGIC: v12 requires the .Horizon namespace
const server = new StellarSdk.Horizon.Server('https://api.testnet.minepi.com');
const networkPassphrase = 'Pi Testnet';

async function executeTreasuryLock() {
    console.log("🚀 MESH SRE: Initiating Treasury Lock Protocol...");
    
    try {
        // Target: The Distributor Vault
        const distributorKeypair = StellarSdk.Keypair.fromSecret(process.env.DISTRIBUTOR_SECRET_KEY);
        
        console.log(`📡 Connecting to Horizon for Distributor Vault...`);
        const account = await server.loadAccount(distributorKeypair.publicKey());

        // The 3-of-4 Matrix Definition
        const founderKey = process.env.FOUNDER_PUBLIC_KEY;
        const elderKey = process.env.ELDER_PUBLIC_KEY;
        const meshKey = process.env.MESH_PUBLIC_KEY;

        console.log("⚙️ Forging Multisig Matrix Signers...");

        // Build the Blockchain Alteration Payload
        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: '100000', // 🚀 MESH OVERRIDE: 100,000 stroops to cover 4 operations
            networkPassphrase: networkPassphrase
        })
        // Add Founder
        .addOperation(StellarSdk.Operation.setOptions({
            signer: { ed25519PublicKey: founderKey, weight: 1 }
        }))
        // Add Elder (Adora's Node for Test)
        .addOperation(StellarSdk.Operation.setOptions({
            signer: { ed25519PublicKey: elderKey, weight: 1 }
        }))
        // Add MESH App Automated Node
        .addOperation(StellarSdk.Operation.setOptions({
            signer: { ed25519PublicKey: meshKey, weight: 1 }
        }))
        // Lock the Vault Thresholds
        .addOperation(StellarSdk.Operation.setOptions({
            masterWeight: 1, // Distributor's own original key weight
            lowThreshold: 0,
            medThreshold: 3, // Requires 3 of 4 to move mBZR
            highThreshold: 3 // Requires 3 of 4 to change account settings
        }))
        .setTimeout(30)
        .build();

        // The Distributor signs its own modification
        transaction.sign(distributorKeypair);
        
        console.log("🔐 Matrix Compiled. Submitting to Pi Testnet Horizon...");
        const response = await server.submitTransaction(transaction);
        
        console.log("✅ MESH SUCCESS: Treasury is now strictly locked in 3-of-4 Consensus.");
        console.log(`🔗 Ledger Hash: ${response.hash}`);

    } catch (error) {
        console.error("❌ MESH CRITICAL ERROR:");
        console.error(error.response && error.response.data ? JSON.stringify(error.response.data.extras.result_codes, null, 2) : error);
    }
}

executeTreasuryLock();