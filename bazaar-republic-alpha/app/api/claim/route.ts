import { NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';
import { MongoClient } from 'mongodb';

export async function POST(req: Request) {
    console.log("🚀 MESH ENGINE: Claim Protocol Triggered");

    // 🚨 SINGLETON CLIENT DECLARATION (Prevents TS2451 Scope Errors)
    const client = new MongoClient(process.env.MONGODB_URI as string);

    try {
        const body = await req.json();
        const { wallet_address } = body;
        
        if (!wallet_address) {
            return NextResponse.json({ error: "Address required." }, { status: 400 });
        }

        // MESH-CORE: Stripping hidden whitespace to prevent Oracle null-returns
        const cleanAddress = wallet_address.trim();

        // --- PHASE 1 & 2: ORACLE & GOVERNANCE ---
        await client.connect();
        
        // 🚨 MESH-CORE: Hard-Coded Path to Alpha Registry
        const db = client.db('bazaar_republic_alpha');
        const collection = db.collection('pioneers');
        
        console.log(`🔍 ORACLE SCANNING FOR: "${cleanAddress}"`);
        const pioneer = await collection.findOne({ wallet_address: cleanAddress });

        if (!pioneer) {
            return NextResponse.json({ error: "Wallet not found in registry." }, { status: 403 });
        }

        // 🚨 MESH-CORE: CREDENTIAL DISCOVERY
        const credentials = pioneer.credentials || { role: "PIONEER" };
        const isFounder = credentials.role === "FOUNDER_NODE";

        // 🛡️ GENESIS OVERRIDE: Founders bypass TS decay locks.
        if (!isFounder && (pioneer.calculated_ts === undefined || pioneer.calculated_ts < 1)) {
            return NextResponse.json({ error: "Governance Lock: TrustScore insufficient." }, { status: 403 });
        }

        // 🚨 MESH-CORE: THE TRUST MATRIX & DYNAMIC REWARDS
        const calculated_ts = pioneer.calculated_ts !== undefined ? pioneer.calculated_ts : 0;
        const trustFactor = calculated_ts / 100; // Normalizes TS 100 to 1.0x

        // Founders receive a 2.0x permanent yield multiplier.
        const genesisMultiplier = isFounder ? 2.0 : 1.0; 

        // Tallying Proof-of-Contribution
        const contributions = pioneer.contributions || [];
        const totalImpactScore = contributions.reduce((sum: number, task: any) => sum + (task.impact_score || 0), 0);
        
        // The Math: ((Base + (Impact * 0.5)) * TrustFactor) * GenesisMultiplier
        const baseTranche = 10;
        const bonusMultiplier = 0.5;
        
        let calculatedTranche = (baseTranche + (totalImpactScore * bonusMultiplier)) * trustFactor;
        calculatedTranche = calculatedTranche * genesisMultiplier;
        
        // 🛡️ Format for Pi Testnet Ledger (Strictly 7 decimal places as a string)
        const formattedAmount = calculatedTranche.toFixed(7);
        
        if (isFounder) {
             console.log(`👑 GENESIS NODE DETECTED: Security Circle Active -> Tranche [${formattedAmount} mBZR]`);
        } else {
             console.log(`🛡️ TRUST MATRIX TRIGGERED: TS [${calculated_ts}] | Impact [${totalImpactScore}] -> Tranche [${formattedAmount} mBZR]`);
        }

        // --- PHASE 3: THE VAULT ---
        let distributorKeypair = StellarSdk.Keypair.fromSecret(process.env.DISTRIBUTOR_SECRET_KEY as string);
        const server = new StellarSdk.Horizon.Server('https://api.testnet.minepi.com');
        let response: any;
        let retries = 3;

        while (retries > 0) {
            try {
                const account = await server.loadAccount(distributorKeypair.publicKey());
                const transaction = new StellarSdk.TransactionBuilder(account, {
                    fee: '100000',
                    networkPassphrase: 'Pi Testnet'
                })
                .addOperation(StellarSdk.Operation.payment({
                    destination: cleanAddress,
                    asset: StellarSdk.Asset.native(),
                    amount: formattedAmount 
                }))
                .setTimeout(30)
                .build();

                transaction.sign(distributorKeypair);
                response = await server.submitTransaction(transaction);
                break; 
            } catch (err: any) {
                // 🛡️ Sequence Error Bypasser (Mempool collision protection)
                if (err.response?.data?.extras?.result_codes?.transaction === 'tx_bad_seq' && retries > 1) {
                    retries--;
                    await new Promise(resolve => setTimeout(resolve, 500));
                    continue;
                }
                throw err;
            }
        }

        return NextResponse.json({ 
            status: "CLAIM_SUCCESS", 
            ledger_hash: response.hash,
            tranche_awarded: formattedAmount
        }, { status: 200 });

    } catch (error: any) {
        console.error("❌ MESH CRITICAL ERROR:", error.message);
        return NextResponse.json({ error: "Transaction failed." }, { status: 500 });
    } finally {
        // 🚨 CRITICAL: Always seal the DB connection to prevent memory leaks on Vercel Node
        await client.close(); 
    }
}