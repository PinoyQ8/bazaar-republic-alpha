import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    return NextResponse.json(
      { error: "Vault Error: MONGODB_URI is missing from environment." }, 
      { status: 500 }
    );
  }

  let client: MongoClient | null = null;

  try {
    // Initialize MongoDB Client with the J: Drive environment string
    client = new MongoClient(uri);
    
    // Attempt connection to Atlas cluster
    await client.connect();
    
    // Execute a lightweight ping command to verify cluster responsiveness
    const db = client.db('bazaar_republic_alpha');
    await db.command({ ping: 1 });

    return NextResponse.json({
      status: "MESH SECURE",
      message: "MongoDB connection verified successfully on J: Drive architecture.",
      cluster: "Bazaar-Vault-01",
      database: db.databaseName,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[MESH ERROR] MongoDB connection failed:", error.message);
    return NextResponse.json({
      status: "MESH FAILURE",
      error: error.message
    }, { status: 500 });

  } finally {
    // Ensure socket is closed to prevent connection leaks during local hot-reloading
    if (client) {
      await client.close();
    }
  }
}