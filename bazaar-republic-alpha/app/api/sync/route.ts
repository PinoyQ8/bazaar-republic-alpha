import { NextResponse } from 'next/server';

// 🛡️ MESH-OVERRIDE: Total Global Scope Purge. 
// No database connections, no env variable calls, no global constants.

export async function POST(req: Request) {
    console.log("🚀 [MESH-SYNC] Sync engine offline for migration.");
    
    return NextResponse.json({ 
        status: "MIGRATING", 
        message: "Sync engine transitioning to Neon Postgres." 
    }, { status: 200 });
}

export async function GET(req: Request) {
    return NextResponse.json({ 
        status: "MIGRATING", 
        message: "Sync engine transitioning to Neon Postgres." 
    }, { status: 200 });
}
