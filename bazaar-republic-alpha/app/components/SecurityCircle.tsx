'use client';

import { useState } from 'react';
import { useMeshStatus } from './MeshInitializer';
import { linkSecurityNode } from '@/app/actions/security';

export function SecurityCircle() {
  const { isPiReady, isAuthenticated, user } = useMeshStatus();
  const [nodeInput, setNodeInput] = useState('');
  const [trustGraph, setTrustGraph] = useState<string[]>([]);
  const [isLinking, setIsLinking] = useState(false);

  // 🛡️ MESH Logic: 5 nodes = 100% Uptime Shield contribution
  const shieldStrength = Math.min((trustGraph.length / 5) * 100, 100);

  const handleLinkNode = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedInput = nodeInput.trim().toLowerCase();
    
    if (!sanitizedInput || trustGraph.includes(sanitizedInput)) return;

    setIsLinking(true);
    
    try {
      // 🛡️ Execute the backend mutation directly
      await linkSecurityNode(user?.uid, sanitizedInput);
      
      setTrustGraph(prev => [...prev, sanitizedInput]);
      setNodeInput('');
    } catch (error) {
      console.error("[ADJUDICATOR] Node Link Failure:", error);
    } finally {
      setIsLinking(false);
    }
  };

  if (!isPiReady) return <div className="animate-pulse text-amber-700">SCANNING MESH...</div>;
  
  if (!isAuthenticated) return (
    <div className="p-4 border border-red-900 bg-red-950/30 text-red-500 rounded">
      ⚠️ MESH FRACTURE: Identity unverified. Cannot establish Trust Graph.
    </div>
  );

  return (
    <div className="border border-amber-900 bg-neutral-900/50 p-6 rounded-lg max-w-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-amber-500">SECURITY CIRCLE</h2>
        <span className="text-sm px-2 py-1 bg-amber-950 border border-amber-700 rounded text-amber-400">
          NODE: @{user?.username}
        </span>
      </div>

      {/* 🛡️ SHIELD METRIC */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-neutral-400">SHIELD STRENGTH</span>
          <span className={shieldStrength === 100 ? "text-green-500 font-bold" : "text-amber-500"}>
            {shieldStrength}%
          </span>
        </div>
        <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
          <div 
            className={`h-full transition-all duration-500 ease-out ${shieldStrength === 100 ? 'bg-green-500' : 'bg-amber-600'}`}
            style={{ width: `${shieldStrength}%` }}
          />
        </div>
      </div>

      {/* 🛡️ NODE INJECTION FORM */}
      <form onSubmit={handleLinkNode} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">@</span>
          <input
            type="text"
            value={nodeInput}
            onChange={(e) => setNodeInput(e.target.value)}
            placeholder="Pioneer Username"
            disabled={isLinking || shieldStrength === 100}
            className="w-full bg-neutral-950 border border-amber-900/50 rounded p-2 pl-8 text-amber-100 focus:outline-none focus:border-amber-500 disabled:opacity-50"
          />
        </div>
        <button 
          type="submit"
          disabled={isLinking || !nodeInput.trim() || shieldStrength === 100}
          className="bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:hover:bg-amber-700"
        >
          {isLinking ? 'SYNCING...' : 'LINK NODE'}
        </button>
      </form>

      {/* 🛡️ TRUST GRAPH LEDGER */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-neutral-500 tracking-widest mb-3">LINKED PIONEERS ({trustGraph.length}/5)</h3>
        {trustGraph.length === 0 ? (
          <p className="text-sm text-neutral-600 italic">No nodes anchored to your shield.</p>
        ) : (
          trustGraph.map((node, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-amber-200">@{node}</span>
              <span className="ml-auto text-xs text-neutral-500">VERIFIED</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}