"use client";

import { useAuth } from "../context/AuthContext";

export default function MeshScanNode() {
  const { pioneer, executeStakePayment } = useAuth();
  
  const status = pioneer?.isAuthenticated 
    ? `Aligned: ${pioneer.username}` 
    : "Awaiting Uplink...";

  const handleSync = () => {
    if (typeof executeStakePayment === 'function') {
      executeStakePayment(10, "MESH_SYNC_AUTH");
      console.log("[MESH-BRIDGE] Payment request broadcasted.");
    } else {
      console.error("[MESH-BRIDGE] Payment function missing in Context.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-900 font-mono p-8">
      <h1 className="text-3xl font-bold mb-4 tracking-widest border-b border-gray-900 pb-2">
        X570 TERMINAL: MESH-SCAN
      </h1>
      
      <div className="bg-gray-100 p-6 rounded-md border border-gray-400 w-full max-w-2xl mb-8">
        <p className="mb-4">SYSTEM STATUS: {status}</p>
        <p className="text-xs text-gray-500">
          NODE: {pioneer?.isAuthenticated ? pioneer.username : "OFFLINE"}
        </p>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={handleSync}
          className="px-6 py-3 font-bold bg-blue-600 text-white rounded uppercase hover:bg-blue-700 transition-colors"
        >
          Execute Sync
        </button>
      </div>
    </div>
  );
}