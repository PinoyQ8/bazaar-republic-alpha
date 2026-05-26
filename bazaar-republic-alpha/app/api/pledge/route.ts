import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb'; // 🛡️ 'Document' import removed to prevent collisions

// 🚨 MESH-CORE: STRICT DATA INTERFACES
interface PioneerContribution {
    task_id: string;
    impact_score: number;
    timestamp: string;
}

interface PioneerNode {
    uid: string;
    wallet_address: string;
    calculated_ts?: number;
    contributions?: PioneerContribution[];
}

// 🚨 MESH-CORE: THE HARD-CODED TASK LEDGER
const TASK_LEDGER: Record<string, { impact: number, trust: number }> = {
    "NODE_UPTIME": { impact: 10, trust: 5 },
    "CODE_REVIEW": { impact: 20, trust: 10 },
    "DAO_VOTE": { impact: 5, trust: 2 },
    "SECURITY_AUDIT": { impact: 50, trust: 15 },
    "MERCHANT_ONBOARD": { impact: 25, trust: 10 }
};

export async function POST(req: Request) {
    console.log("🚀 MESH ENGINE: Pledge Protocol Triggered");

    const client = new MongoClient(process.env.MONGODB_URI as string);

    try {
        // 1. 🛡️ VERIFY THE ZERO-TRUST VAULT (Double-Check Architecture)
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: "Unauthorized Node Access." }, { status: 401 });
        }
        const accessToken = authHeader.split(' ')[1];

        const piRes = await fetch('https://api.minepi.com/v2/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!piRes.ok) {
            return NextResponse.json({ error: "Pi Session Invalid." }, { status: 401 });
        }
        
        const piData = await piRes.json();
        const verifiedUid = piData.uid;

        const body = await req.json();
        const { task_id } = body; // wallet_address is no longer trusted from client
        
        if (!task_id) {
            return NextResponse.json({ error: "Task ID required." }, { status: 400 });
        }

        const taskData = TASK_LEDGER[task_id];

        if (!taskData) {
            return NextResponse.json({ error: "Invalid Task ID submitted to the MESH." }, { status: 403 });
        }

        await client.connect();
        const db = client.db('bazaar_republic_alpha');
        
        // 🛡️ APPLY THE INTERFACE TO THE COLLECTION
        const collection = db.collection<PioneerNode>('pioneers');

        const pioneer = await collection.findOne({ uid: verifiedUid });
        
        if (!pioneer) {
            return NextResponse.json({ error: "Node not found in registry." }, { status: 403 });
        }
        const cleanAddress = pioneer.wallet_address; // Retrieved securely from DB

        // 🚨 MESH-CORE: TRUSTSCORE HEALING & IMPACT CALCULATION
        const current_ts = pioneer.calculated_ts !== undefined ? pioneer.calculated_ts : 0;
        const new_ts = Math.min(current_ts + taskData.trust, 100); 

        // 🛡️ STRICT TYPING FOR THE ARRAY PUSH
        const newContribution: PioneerContribution = {
            task_id: task_id,
            impact_score: taskData.impact,
            timestamp: new Date().toISOString()
        };

        // 🛡️ DATABASE ETCHING: The Override
        await collection.updateOne(
            { wallet_address: cleanAddress },
            { 
                $push: { contributions: newContribution },
                $set: { calculated_ts: new_ts }
            } as any // 🚨 MESH-CORE: Bypasses the driver's TS index signature bug
        );

        console.log(`✅ PLEDGE VERIFIED: [${task_id}] -> TS Healed to [${new_ts}], Impact +[${taskData.impact}]`);

        return NextResponse.json({ 
            status: "PLEDGE_SUCCESS", 
            new_trust_score: new_ts,
            impact_awarded: taskData.impact
        }, { status: 200 });

    } catch (error: any) {
        console.error("❌ MESH CRITICAL ERROR:", error.message);
        return NextResponse.json({ error: "Pledge execution failed." }, { status: 500 });
    } finally {
        await client.close();
    }
}