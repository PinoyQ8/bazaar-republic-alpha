"use server"; // 🛡️ CRITICAL MESH SHIELD: Enforces execution on the secure backend

import { connectToUplink } from './mongodb';

export const initializeModule = async (moduleId: string) => {
  try {
    // 1. Establish Handshake with MongoDB
    const db = await connectToUplink();
    
    // 2. Fetch Logic State from the MESH
    const moduleConfig = await db.collection('modules').findOne({ id: moduleId });
    
    if (!moduleConfig) {
      throw new Error(`Sector ${moduleId} not found in E-Network`);
    }

    // 3. Return Active Sync Status
    return {
      status: 'NEO_SYNC_ACTIVE',
      timestamp: new Date().toISOString(),
      // Ensure we don't pass complex MongoDB ObjectIds back to the client directly
      payload: JSON.parse(JSON.stringify(moduleConfig)) 
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "MESH_UPLINK_TIMEOUT";
    console.error("❌ MESH CRITICAL: Initialization Failure", errorMessage);
    
    return { 
      status: 'HARD_LOCK', 
      error: errorMessage 
    };
  }
};