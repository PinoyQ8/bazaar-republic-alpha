import { NextResponse } from 'next/server';

// 🛡️ THE MESH OVERRIDE: Legacy NoSQL imports completely purged.
// ❌ PURGED: import { connectToDatabase } from '@/lib/db';
// ❌ PURGED: import ProposalRecord from '@/models/ProposalRecord'; // (or similar)

export async function GET(req: Request, { params }: { params: { id: string } }) {
    console.log(`🚀 [MESH-SYNC] Legacy Governance Proposal [${params.id}] route offline for Drizzle migration.`);

    return NextResponse.json({ 
        status: "MIGRATING", 
        message: "Governance proposal engine transitioning to Neon Postgres." 
    }, { status: 200 });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    console.log(`🚀 [MESH-SYNC] Legacy Governance Proposal [${params.id}] update offline.`);

    return NextResponse.json({ 
        status: "MIGRATING", 
        message: "Governance proposal engine transitioning to Neon Postgres." 
    }, { status: 200 });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    console.log(`🚀 [MESH-SYNC] Legacy Governance Proposal [${params.id}] mutation offline.`);

    return NextResponse.json({ 
        status: "MIGRATING", 
        message: "Governance proposal engine transitioning to Neon Postgres." 
    }, { status: 200 });
}