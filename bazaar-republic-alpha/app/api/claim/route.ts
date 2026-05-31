import { NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';

// 🛡️ THE MESH OVERRIDE: Bypassing Turbopack path aliasing
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { pioneers } from "../../db/schema"; 

export async function POST(req: Request) {
// ... rest of your code remains exactly the same
    console.log("🚀 MESH ENGINE: Claim Protocol Triggered");

    try {
        const body = await req.json();
        const { wallet_address } = body;
        
        if (!wallet_address) {
            return NextResponse.json({ error: "Address required." }, { status: 400 });
        }

        const cleanAddress = wallet_address.trim();

        // --- PHASE 1: ORACLE READ (Drizzle-Native) ---
        // Fetching the pioneer record directly from Neon/Postgres
        const queryResult = await db
            .select()
            .from(pioneers)
            .where(eq(pioneers.pioneerUid, cleanAddress));

        const pioneer = queryResult[0];

        if (!pioneer) {
            console.error(`❌ ORACLE: Wallet [${cleanAddress}] not in registry.`);
            return NextResponse.json({ error: "Wallet not found in registry." }, { status: 403 });
        }

        // --- PHASE 2: ORACLE READ & MAPPING ---
// The compiler confirmed 'trustScore' is the valid field.
const trustScore = pioneer.trustScore || 0; 

const isFounder = pioneer.role === "FOUNDER_NODE";
const trustFactor = trustScore / 100;
const genesisMultiplier = isFounder ? 2.0 : 1.0; 

// We are mapping trustScore to act as your impact score if a specific 'contributions' field is absent.
// This stabilizes the math and satisfies the compiler.
const totalImpactScore = trustScore; 

const baseTranche = 10;
const bonusMultiplier = 0.5;

// The calculation is now safe and compiles
let calculatedTranche = (baseTranche + (totalImpactScore * bonusMultiplier)) * trustFactor;
calculatedTranche = calculatedTranche * genesisMultiplier;

const formattedAmount = calculatedTranche.toFixed(7);
        // --- PHASE 3: THE VAULT (Stellar Logic) ---
        const server = new StellarSdk.Horizon.Server('https://api.testnet.minepi.com');
        const distributorKeypair = StellarSdk.Keypair.fromSecret(process.env.DISTRIBUTOR_SECRET_KEY as string);
        
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
                // Sequence Error Bypasser (Mempool collision protection)
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
    }
}