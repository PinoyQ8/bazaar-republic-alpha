// Location: app/components/mesh/VerificationSector.tsx
"use client";

import React, { useState, useEffect } from 'react';

// Lock the expected telemetry shape
interface PendingNode {
  _id: string;
  pioneerUid: string;
  businessName: string;
  serviceCategory: string;
  complianceHash: string;
  registeredAt: string;
}

export default function VerificationSector() {
  const [pendingNodes, setPendingNodes] = useState<PendingNode[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 🛡️ INITIALIZATION SCAN: Sweep ledger for PENDING_VERIFICATION nodes
  useEffect(() => {
    fetchPendingNodes();
  }, []);

  const fetchPendingNodes = async () => {
    try {
      const response = await fetch('/api/e-network/pending-nodes', {
        headers: { 
          'x-mesh-pioneer-role': 'FOUNDER', // Clearance simulation
          'x-mesh-pioneer-uid': 'GENESIS-ANCHOR'
        } 
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPendingNodes(data.nodes);
        }
      }
    } catch (error) {
      console.error("[MESH-SCAN] Master Index fetch failed:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const executeAdjudication = async (providerId: string, status: 'ACTIVE' | 'REJECTED') => {
    setProcessingId(providerId);
    try {
      const response = await fetch('/api/e-network/verify', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-mesh-pioneer-role': 'FOUNDER', // Clearance simulation
        },
        body: JSON.stringify({ providerId, newStatus: status })
      });

      const data = await response.json();
      if (data.success) {
        // Drop the adjudicated node from local memory
        setPendingNodes(prev => prev.filter(node => node._id !== providerId));
      } else {
        alert(`[ADJUDICATOR FRACTURE]: ${data.error}`);
      }
    } catch (error) {
      console.error("[ADJUDICATION_PANIC]:", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 border border-emerald-900/30 bg-black rounded-lg font-mono text-emerald-500 shadow-[0_0_15px_rgba(4,120,87,0.1)]">
      <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b border-emerald-900/50 pb-2 text-emerald-400 flex justify-between items-center">
        <span>Verification Sector // Adjudicator Console</span>
        <span className="text-xs bg-slate-900 px-2 py-1 rounded border border-slate-700">
          Pending Nodes: {pendingNodes.length}
        </span>
      </h2>

      <div className="space-y-4 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
        {isScanning ? (
          <div key="scanning-state" className="text-emerald-700 text-xs border border-emerald-900/30 p-6 text-center animate-pulse">
            [SCANNING LEDGER FOR PENDING NODES...]
          </div>
        ) : pendingNodes.length === 0 ? (
          <div key="empty-state" className="text-slate-500 text-xs border border-slate-800 p-6 text-center border-dashed">
            [NO PENDING NODE REGISTRATIONS DETECTED]
          </div>
        ) : (
          pendingNodes.map((node, index) => (
            <div key={node._id ? node._id.toString() : `node-fallback-${index}`} className="border border-slate-700 bg-slate-900/50 rounded-lg p-4 w-full">
              
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-widest uppercase">{node.businessName}</h3>
                  <p className="text-xs text-slate-400">UID: {node.pioneerUid}</p>
                </div>
                <div className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-600">
                  {node.serviceCategory}
                </div>
              </div>

              <div className="bg-black/50 p-2 rounded border border-slate-800 mb-4">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Compliance Hash</p>
                <p className="text-xs text-emerald-500 break-all">{node.complianceHash}</p>
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={() => executeAdjudication(node._id, 'ACTIVE')}
                  disabled={processingId === node._id}
                  className="grow py-2 bg-emerald-800/30 text-emerald-400 border border-emerald-800 font-bold text-xs uppercase tracking-widest hover:bg-emerald-800 hover:text-black transition-all disabled:opacity-50"
                >
                  {processingId === node._id ? "Executing..." : "Activate Shield"}
                </button>
                <button 
                  onClick={() => executeAdjudication(node._id, 'REJECTED')}
                  disabled={processingId === node._id}
                  className="grow py-2 bg-red-900/30 text-red-400 border border-red-900 font-bold text-xs uppercase tracking-widest hover:bg-red-800 hover:text-black transition-all disabled:opacity-50"
                >
                  {processingId === node._id ? "Executing..." : "Reject Node"}
                </button>
              </div>
              
            </div>
          ))
        )}
      </div>
    </div>
  );
}