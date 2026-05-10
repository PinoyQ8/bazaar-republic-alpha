"use client";

import React from 'react';
import { initializeModule } from '@/lib/init-module';

export default function InitializeModule() {
  // SECTOR 1: Logic Handshake
  const handleInit = async () => {
    console.log("🚀 MESH-SYNC: Activating Sector Alpha...");
    
    // Using a relative path for the API call inside the lib to prevent Mixed Content
    const response = await initializeModule("sector-alpha");
    
    if (response.status === 'NEO_SYNC_ACTIVE') {
      console.log("✅ UPLINK: Handshake Successful.");
    } else {
      console.error("❌ UPLINK: Hard-Lock Detected.", response.error);
    }
  };

  // SECTOR 2: The Viewport Render (The Fix for Error 1108)
  return (
    <div className="module-init-container p-4 border border-zinc-800 rounded-lg">
      <h3 className="text-sm font-mono mb-4 text-zinc-400">NEO-PROTOCOL: INITIALIZATION_NODE</h3>
      
      <button 
        id="btn-initialize-alpha" 
        name="initialize_module_trigger" 
        onClick={handleInit}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-all"
      >
        Initialize Module
      </button>

      <p className="mt-2 text-xs text-zinc-500 font-mono">
        Status: Ready for E-Network Sync
      </p>
    </div>
  );
}