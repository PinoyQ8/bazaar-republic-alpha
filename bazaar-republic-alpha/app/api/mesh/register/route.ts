import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb'; // Ensure this alias maps to your lib/mongodb.ts

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, uid, status } = body;

    if (!username || !uid) {
      return NextResponse.json(
        { error: 'MESH-FRACTURE: Missing Node Identity Data' }, 
        { status: 400 }
      );
    }

    // 1. Establish Secure Link to bazaar_republic_alpha
    const db = await connectToLedger();
    
    // 2. Define the Collection (The Ledger)
    const registry = db.collection('pioneers');

    // 3. Execute the Upsert (Create if missing, update if exists)
    const result = await registry.updateOne(
      { username: username }, 
      { 
        $set: { 
          uid: uid,
          status: status || 'active',
          last_sync: new Date().toISOString()
        },
        $setOnInsert: {
          tier: 'Citizen', // 🛡️ The baseline default for all new E-Network nodes
          created_at: new Date().toISOString()
        }
      },
      { upsert: true } // 🛡️ Self-Healing core
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Node Anchored to Registry',
      acknowledged: result.acknowledged 
    }, { status: 200 });

  } catch (error) {
    console.error('[MESH-API] Ledger Write Fracture:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}