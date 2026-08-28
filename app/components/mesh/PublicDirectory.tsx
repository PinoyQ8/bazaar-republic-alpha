"use client";

import React, { useState, useEffect } from 'react';

// 🛡️ TELEMETRY LOCK: Only public parameters are permitted in this interface
interface ActiveNode {
  _id: string;
  businessName: string;
  serviceCategory: string;
  registeredAt: string;
}

export default function PublicDirectory() {
  const [nodes, setNodes] = useState<ActiveNode[]>([]);
  const [isScanning, setIsScanning] = useState(true);

  // 🛡️ INITIALIZATION SCAN: Sweep ledger for ACTIVE nodes
  useEffect(() => {
    fetchActiveNodes();
  }, []);

  const fetchActiveNodes = async () => {
    try {
      const response = await fetch('/api/e-network/active-nodes');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNodes(data.nodes);
        }
      }
    } catch (error) {
      console.error("[MESH-SCAN] Public Directory fetch failed:", error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-6 border border-emerald-900/30 bg-black rounded-lg font-mono text-emerald-500 shadow-[0_0_15px_rgba(4,120,87,0.1)]">
      <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b border-emerald-900/50 pb-2 text-emerald-400 flex justify-between items-center">
        <span>E-Network // Active Service Providers</span>
        <span className="text-xs bg-emerald-900/30 px-2 py-1 rounded border border-emerald-800 text-emerald-300">
          Nodes Online: {nodes.length}
        </span>
      </h2>

      {/* 🛡️ LINTER FIX: max-h-[600px] converted to max-h-150 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-150 overflow-y-auto pr-2 custom-scrollbar">
        {isScanning ? (
          <div className="col-span-full text-emerald-700 text-xs border border-emerald-900/30 p-6 text-center animate-pulse">
            [SCANNING LEDGER FOR ACTIVE MESH NODES...]
          </div>
        ) : nodes.length === 0 ? (
          <div className="col-span-full text-slate-500 text-xs border border-slate-800 p-6 text-center border-dashed">
            [NO ACTIVE PROVIDERS DETECTED IN THE DIRECTORY]
          </div>
        ) : (
          nodes.map((node) => (
            <div key={node._id} className="border border-emerald-900/40 bg-slate-900/40 rounded-lg p-4 hover:border-emerald-500/50 transition-all group">
              
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-widest uppercase group-hover:text-emerald-400 transition-colors">
                    {node.businessName}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">
                    INIT: {new Date(node.registeredAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-black border border-emerald-900 text-emerald-500 shadow-[0_0_5px_rgba(4,120,87,0.2)]">
                  {node.serviceCategory}
                </div>
              </div>

              {/* 🛡️ LINTER FIX: h-[1px] converted to h-px, bg-gradient-to-r converted to bg-linear-to-r */}
              <div className="w-full h-px bg-linear-to-r from-emerald-900/50 to-transparent my-2"></div>
              
              <div className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                Uptime Shield Active
              </div>
              
            </div>
          ))
        )}
      </div>
    </div>
  );
}