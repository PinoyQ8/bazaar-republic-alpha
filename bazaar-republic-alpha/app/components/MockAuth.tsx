"use client";

import React, { useState } from 'react';
import GovernanceDashboard from './GovernanceDashboard';

export default function MockAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const executeGhostAuth = () => {
    setIsAuthenticating(true);
    
    // Simulate Pi SDK network handshake latency
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsAuthenticating(false);
    }, 1500);
  };

  // If authenticated, render the Emerald HUD and pass the dummy Pioneer ID
  if (isAuthenticated) {
    return <GovernanceDashboard activePioneerId="DEMO-PIONEER-77X" />;
  }

  // The Ghost Gateway UI
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black font-mono">
      <div className="p-8 border border-purple-900/50 bg-gray-900/80 rounded-lg shadow-[0_0_20px_rgba(128,0,128,0.2)] text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-purple-400 mb-2">Bazaar Republic</h1>
        <h2 className="text-xs text-gray-500 mb-6 uppercase tracking-widest border-b border-gray-800 pb-4">
          Public Sandbox UI Preview
        </h2>
        
        <p className="text-xs text-gray-400 mb-8">
          This is an air-gapped preview environment. No real Pi is required. No real Mainnet data is connected.
        </p>

        <button 
          onClick={executeGhostAuth}
          disabled={isAuthenticating}
          className="w-full py-4 bg-purple-700 hover:bg-purple-600 text-white font-bold tracking-widest rounded disabled:opacity-50 transition-all border border-purple-500 shadow-[0_0_10px_rgba(128,0,128,0.4)] uppercase text-sm"
        >
          {isAuthenticating ? "BRIDGING TO MESH..." : "CONNECT TO DEMO MESH"}
        </button>
      </div>
    </div>
  );
}