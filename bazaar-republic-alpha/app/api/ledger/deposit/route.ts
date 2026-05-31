import { NextResponse } from 'next/server';

// 🛡️ THE MESH OVERRIDE: Legacy NoSQL imports completely purged.
// ❌ PURGED: import { connectToDatabase } from '@/lib/db';
// ❌ PURGED: import DepositRecord from '@/models/DepositRecord'; // (or similar legacy models)

export async function POST(req: Request) {
    console.log("🚀 [MESH-SYNC] Legacy Ledger Deposit route offline for Drizzle migration.");

    try {
        // 🛡️ THE MESH OVERRIDE: Legacy NoSQL logic neutralized.
        // All Mongoose DB mutation commands have been disconnected.

        return NextResponse.json({ 
            status: "MIGRATING", 
            message: "Ledger deposit engine transitioning to Neon Postgres." 
        }, { status: 200 });

    } catch (error: any) {
        console.error("❌ MESH CRITICAL ERROR:", error.message);
        return NextResponse.json({ error: "Routing failed during migration." }, { status: 500 });
    }
}
