"use server"; // 🛡️ SERVER BOUNDARY: Protects the database credentials

import { connectToUplink } from './mongodb';

export async function fetchPioneerLedger(wallet: string) {
  try {
    const db = await connectToUplink();
    const collection = db.collection("pioneer_registry");

    // Query the Data Fortress for the exact node
    const pioneerData = await collection.findOne({ wallet_address: wallet });

    if (!pioneerData) {
      return { status: 'UNREGISTERED', data: null };
    }

    // Strip complex MongoDB ObjectIds before crossing the client boundary
    return { 
      status: 'FORGED', 
      data: JSON.parse(JSON.stringify(pioneerData)) 
    };

  } catch (error) {
    console.error("❌ MESH-SCAN: Oracle Read Failed");
    return { status: 'HARD_LOCK', data: null };
  }
}