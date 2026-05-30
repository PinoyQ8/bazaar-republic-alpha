import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { ObjectId } from 'mongodb'; 

// 🛡️ THE MESH OPTIMIZED API ROUTE (Mongoose Severed)
export async function GET(request: Request) {
  try {
    // Extract the ID from the URL parameters
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('id');

    if (!identifier || identifier === "GHOST_NODE") {
      console.warn("[MESH-REJECT] Telemetry sync denied: Missing Identity.");
      return NextResponse.json(
        { success: false, error: 'MESH-REJECT: Missing Pioneer Identity Parameter' }, 
        { status: 400 }
      );
    }

    // 1. Connect directly to the cached Native Edge Pool
    const db = await connectToLedger();
    
    // Check if the parameter is a 24-char Mongo ID to prevent casting errors
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    // 🛡️ THE MESH SWEEP QUERY: Added 'uid' to maintain backward compatibility with Sector 1
    const query = isMongoId 
      ? { _id: new ObjectId(identifier) } 
      : { $or: [{ uid: identifier }, { pi_uid: identifier }, { username: identifier }] }; 

    // 2. Execute Native Read
    const pioneerData = await db.collection('pioneers').findOne(query);

    if (!pioneerData) {
      return NextResponse.json(
        { success: false, error: 'Node Not Found in Ledger' }, 
        { status: 404 }
      );
    }

    // 3. Serialization Shield & Response (Mapped to 'telemetry' for HUD sync)
    return NextResponse.json({ 
      success: true, 
      telemetry: {
        ...pioneerData,
        _id: pioneerData._id.toString(), // Purge the raw ObjectId wrapper for JSON transit
      },
      timestamp: Date.now()
    }, { status: 200 });

  } catch (error) {
    console.error('[MESH-SCAN] API Route Native Read Fracture:', error);
    return NextResponse.json(
      { success: false, error: 'FATAL: Native Ledger Read Failed.' }, 
      { status: 500 }
    );
  }
}