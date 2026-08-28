"use client";

import React, { useState, useEffect } from 'react';
// 🛡️ INJECT THE AUTH BRIDGE
import { usePiAuth } from '@/app/components/mesh/PiAuthBridge';

// 🛡️ FULL TELEMETRY LOCK
interface ProviderData {
  _id: string;
  businessName: string;
  serviceCategory: string;
  status: string;
  complianceHash: string;
  registeredAt: string;
}

export default function ProviderDashboard() {
  // 🛡️ EXTRACT REAL PIONEER TELEMETRY
  const { pioneer, isAuthenticated, authenticateNode, authError } = usePiAuth();
  
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 🛡️ LEDGER SCAN: Only trigger once the cryptographic handshake is complete
  useEffect(() => {
    if (isAuthenticated && pioneer) {
      fetchProviderData(pioneer.uid);
    }
  }, [isAuthenticated, pioneer]);

  const fetchProviderData = async (uid: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/e-network/provider', {
        headers: {
          'x-mesh-pioneer-uid': uid // 🛡️ Passing the mathematically verified UID
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setProvider(data.provider);
      } else {
        setError(data.error || 'Failed to sync with ledger');
      }
    } catch (err) {
      setError('Network fracture during MESH scan');
    } finally {
      setIsLoading(false);
    }
  };

  // 🛡️ STATE 1: THE AUTHENTICATION WALL
  if (!isAuthenticated) {
    return (
      <div className="w-full p-8 text-center border border-emerald-900/50 bg-black rounded-lg shadow-[0_0_20px_rgba(4,120,87,0.15)] flex flex-col items-center">
        <h2 className="text-xl font-bold uppercase tracking-widest text-emerald-500 mb-4">Node Disconnected</h2>
        <p className="text-xs text-slate-400 mb-6 max-w-sm">
          You must cryptographically handshake with the Pi Core Servers to access Sector Alpha telemetry.
        </p>
        <button 
          onClick={authenticateNode}
          className="px-6 py-3 bg-black text-emerald-400 font-bold uppercase tracking-widest border border-emerald-500 hover:bg-emerald-500 hover:text-black transition-all shadow-[0_0_15px_rgba(4,120,87,0.3)]"
        >
          Initiate Handshake
        </button>
        {authError && (
          <p className="mt-4 text-[10px] text-red-500 border border-red-900/30 p-2 bg-red-900/10 uppercase tracking-widest">
            [FRACTURE]: {authError}
          </p>
        )}
      </div>
    );
  }

  // 🛡️ STATE 2: LOADING LEDGER DATA
  if (isLoading) {
    return (
      <div className="w-full p-8 text-center text-emerald-500 font-mono border border-emerald-900/30 bg-black rounded animate-pulse text-xs uppercase tracking-widest">
        [INITIALIZING COMMAND CENTER FOR PIONEER: {pioneer?.username}]
      </div>
    );
  }

  // 🛡️ STATE 3: NO NODE DETECTED
  if (error || !provider) {
    return (
      <div className="w-full p-8 text-center text-red-500 font-mono border border-red-900/30 bg-black rounded text-xs uppercase tracking-widest">
        [FRACTURE DETECTED: {error}]<br/>
        <span className="text-slate-500 mt-2 block">Ensure your node is registered on the E-Network.</span>
      </div>
    );
  }

  // 🛡️ STATE 4: THE LIVE DASHBOARD
  return (
    <div className="p-6 border border-emerald-900/50 bg-black rounded-lg font-mono text-emerald-500 shadow-[0_0_20px_rgba(4,120,87,0.15)]">
      <div className="flex justify-between items-end border-b border-emerald-900/50 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-white">
            {provider.businessName}
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 tracking-widest uppercase">
            NODE HUD // PIONEER: {pioneer?.username}
          </p>
        </div>
        <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
          provider.status === 'ACTIVE' 
            ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(4,120,87,0.3)]' 
            : provider.status === 'REJECTED'
            ? 'bg-red-900/30 border-red-500 text-red-400'
            : 'bg-yellow-900/30 border-yellow-500 text-yellow-400'
        }`}>
          STATUS: {provider.status}
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <div className="flex flex-col md:flex-row justify-between bg-slate-900/50 p-4 rounded border border-slate-800">
          <span className="text-slate-400 uppercase tracking-wider text-[10px] mb-1 md:mb-0">Service Category</span>
          <span className="text-emerald-300 font-bold uppercase text-xs">{provider.serviceCategory}</span>
        </div>
        
        {/* Linter Compliant: max-w-50 */}
        <div className="flex flex-col md:flex-row justify-between bg-slate-900/50 p-4 rounded border border-slate-800">
          <span className="text-slate-400 uppercase tracking-wider text-[10px] mb-1 md:mb-0">Cryptographic Seal</span>
          <span className="text-emerald-700 text-xs truncate max-w-50 md:max-w-xs">{provider.complianceHash}</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between bg-slate-900/50 p-4 rounded border border-slate-800">
          <span className="text-slate-400 uppercase tracking-wider text-[10px] mb-1 md:mb-0">Genesis Timestamp</span>
          <span className="text-emerald-300 text-xs">{new Date(provider.registeredAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}