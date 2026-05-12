// Bazaar Republic SRE: The Claim Bridge (Multisig Execution)
import { NextResponse } from 'next/server';
import StellarSdk from 'stellar-sdk';
import { MongoClient } from 'mongodb';

// MESH Architecture Constants
const server = new StellarSdk.Horizon.Server('https://api.testnet.minepi.com');
const networkPassphrase = 'Pi Testnet';
const PAYOUT_AMOUNT = '10.0000000'; // 10 mBZR (Using Testnet Pi as placeholder)

export async function POST(req: Request) {
    console.log("🚀 MESH ENGINE: Claim Protocol Triggered");

    try {
        const body = await req.json();
        const { wallet_address } = body;

        if (!wallet_address) {
            return NextResponse.json({ error: "MESH REJECTED: Wallet address required." }, { status: 400 });
        }

        // --- PHASE 1: THE ORACLE (Database Adjudication) ---
        console.log("🔍 Scanning Data Fortress for TrustScore...");
        const client = new MongoClient(process.env.MONGODB_URI as string);
        await client.connect();
        const db = client.db('bazaar_republic');
        const pioneer = await db.collection('pioneer_registry').findOne({ wallet_address });
        await client.close();

        if (!pioneer || pioneer.calculated_ts < 1) {
            console.log("❌ MESH REJECTED: Insufficient TrustScore.");
            return NextResponse.json({ error: "Governance Lock: TrustScore below required threshold." }, { status: 403 });
        }
        console.log(`✅ Oracle Verified: Pioneer ${wallet_address} is Governance Eligible (TS: ${pioneer.calculated_ts})`);

        // --- PHASE 2: THE VAULT (Multisig Blockchain Execution) ---
        console.log("⚙️ Forging 3-of-4 Multisig Payout Transaction...");
        
        // Retrieve Keys from secure vault
        const distributorKeypair = StellarSdk.Keypair.fromSecret(process.env.DISTRIBUTOR_SECRET_KEY as string);
        const meshKeypair = StellarSdk.Keypair.fromSecret(process.env.MESH_SECRET_KEY as string);
        const founderKeypair = StellarSdk.Keypair.fromSecret(process.env.FOUNDER_SECRET_KEY as string);

        // Load Distributor Account State
        const account = await server.loadAccount(distributorKeypair.publicKey());

        // Build Payload
        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: '100000', // 100,000 stroops to ensure priority routing
            networkPassphrase: networkPassphrase
        })
        .addOperation(StellarSdk.Operation.payment({
            destination: wallet_address,
            asset: StellarSdk.Asset.native(), // Default Pi Testnet asset for Alpha
            amount: PAYOUT_AMOUNT
        }))
        .setTimeout(30)
        .build();

        // The 3-of-4 Matrix Signature Protocol
        transaction.sign(distributorKeypair); // Weight: 1
        transaction.sign(meshKeypair);        // Weight: 2
        transaction.sign(founderKeypair);     // Weight: 3 (Threshold Reached)

        console.log("🔐 Matrix Compiled. Pushing to Pi Horizon...");
        const response = await server.submitTransaction(transaction);

        console.log(`✅ MESH SUCCESS: Payout complete. Ledger Hash: ${response.hash}`);
        return NextResponse.json({ 
            status: "CLAIM_SUCCESS", 
            payout: PAYOUT_AMOUNT,
            ledger_hash: response.hash 
        }, { status: 200 });

    } catch (error: any) {
        console.error("❌ MESH CRITICAL ERROR:", error.response?.data || error.message);
        return NextResponse.json({ error: "Transaction failed on Horizon gateway." }, { status: 500 });
    }
}