import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { ObjectId } from 'mongodb'; // 🛡️ Import for Native ID parsing if needed

// 🛡️ THE MESH OPTIMIZED API ROUTE (Mongoose Severed)
export async function GET(request: Request) {
  try {
    // Extract the ID from the URL parameters
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('id');

    if (!identifier) {
      return NextResponse.json(
        { error: 'MESH-FRACTURE: Missing Pioneer Identity Parameter' }, 
        { status: 400 }
      );
    }

    // 1. Connect directly to the cached Native Edge Pool
    const db = await connectToLedger();
    
    // Check if the parameter is a 24-char Mongo ID to prevent casting errors
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    // 🛡️ THE MESH SWEEP QUERY
    const query = isMongoId 
      ? { _id: new ObjectId(identifier) } 
      : { $or: [{ pi_uid: identifier }, { username: identifier }] }; 

    // 2. Execute Native Read
    const pioneerData = await db.collection('pioneers').findOne(query);

    if (!pioneerData) {
      return NextResponse.json({ error: 'Node Not Found in Ledger' }, { status: 404 });
    }

    // 3. Serialization Shield & Response
    return NextResponse.json({ 
      success: true, 
      data: {
        ...pioneerData,
        _id: pioneerData._id.toString(),
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[MESH-SCAN] API Route Native Read Fracture:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}