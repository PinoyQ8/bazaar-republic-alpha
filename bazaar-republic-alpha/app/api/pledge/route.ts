import { NextResponse } from 'next/server';

// 🛡️ THE MESH OVERRIDE: Legacy NoSQL imports completely purged.
export async function POST(req: Request) {
    console.log("🚀 [MESH-SYNC] Legacy Pledge route offline for Drizzle migration.");

    return NextResponse.json({ 
        status: "MIGRATING", 
        message: "Pledge engine transitioning to Neon Postgres." 
    }, { status: 200 });
}
