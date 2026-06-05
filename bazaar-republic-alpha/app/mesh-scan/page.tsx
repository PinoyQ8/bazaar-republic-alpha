'use client';

import { useAuth } from "../context/AuthContext";

export default function MeshScanNode() {
  const { pioneer, executeStakePayment } = useAuth();
  
  // 🛡️ TS18048 FIX: Enforce a safe fallback before strictly invoking string methods.
  const safeUsername = pioneer?.username || "PIONEER";

  const status = pioneer?.isAuthenticated 
    ? `ALIGNED: ${safeUsername.toUpperCase()}` 
    : "AWAITING UPLINK...";

  const handleSync = () => {
      if (typeof executeStakePayment === 'function') {
        // 🛡️ SCHEMA ALIGNED: The Context strictly expects a number. 
        executeStakePayment(10);
        console.log("[MESH-BRIDGE] Payment request broadcasted.");
      } else {
        console.error("[MESH-BRIDGE] FRACTURE: Payment function missing in Context.");
      }
    };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-500 font-mono p-4 selection:bg-green-900 selection:text-green-100">
      
      {/* Terminal Outer Shield */}
      <div className="w-full max-w-2xl border border-green-500/30 p-1 bg-black/80 shadow-[0_0_20px_rgba(34,197,94,0.15)] rounded-sm">
        
        {/* Terminal Inner Viewport */}
        <div className="border border-green-500/70 p-8 relative">
          
          {/* Hardware Corner Decorators */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-green-400"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-green-400"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-green-400"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-green-400"></div>

          {/* Header */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 tracking-widest border-b border-green-500/50 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
            <span>🛰️ X570 TERMINAL: MESH-SCAN</span>
            <span className="text-xs text-green-600 animate-pulse tracking-normal">
              PORT 3000 // SECURE
            </span>
          </h1>
          
          {/* Telemetry Display */}
          <div className="bg-green-950/20 p-5 rounded-sm border border-green-800/50 mb-8 space-y-3">
            <div className="flex justify-between items-center border-b border-green-900/50 pb-2">
              <span className="text-green-600 text-sm tracking-wider">SYSTEM STATUS:</span> 
              <span className={`text-lg tracking-widest ${pioneer?.isAuthenticated ? "text-green-400 font-bold" : "text-yellow-500 animate-pulse"}`}>
                {status}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-green-700 text-sm tracking-wider">NODE IDENTITY:</span> 
              <span className="text-gray-400">
                {pioneer?.isAuthenticated ? safeUsername : "OFFLINE_GHOST"}
              </span>
            </div>
          </div>

          {/* Action Matrix */}
          <div className="flex justify-center mt-6">
            <button 
              onClick={handleSync}
              disabled={!pioneer?.isAuthenticated}
              className="px-8 py-3 font-bold bg-transparent border border-green-500 text-green-500 rounded-sm uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-green-500 relative group"
            >
              Execute Sync (10 Pi)
              {/* Scanline hover effect */}
              <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-20 pointer-events-none transition-opacity"></div>
            </button>
          </div>

        </div>
      </div>
      
      {/* System Footer */}
      <p className="mt-8 text-xs text-gray-700 tracking-widest">
        PROJECT BAZAAR // E-NETWORK UPLINK
      </p>
    </div>
  );
}