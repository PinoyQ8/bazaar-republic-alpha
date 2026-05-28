"use client";

import React, { useState } from 'react';
import GovernanceDashboard from './GovernanceDashboard';

export default function MockAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDemoNotice, setShowDemoNotice] = useState(false);

  const executeGhostAuth = () => {
    setIsAuthenticated(true);
    setShowDemoNotice(true);
  };

  // Render Logic
  if (isAuthenticated && showDemoNotice) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
        <div className="border border-purple-500 bg-gray-900 p-8 rounded-lg max-w-sm text-center">
          <h2 className="text-purple-400 font-bold text-xl mb-4 uppercase">Demo Simulation</h2>
          <button 
            onClick={() => setShowDemoNotice(false)}
            className="w-full py-3 bg-purple-700 text-white font-bold rounded uppercase text-sm"
          >
            Acknowledge & Enter
          </button>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <GovernanceDashboard activePioneerId="DEMO-PIONEER-77X" />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <button 
        onClick={executeGhostAuth}
        className="px-8 py-4 bg-purple-700 text-white font-bold rounded uppercase tracking-widest hover:bg-purple-600 transition-all"
      >
        CONNECT TO DEMO MESH
      </button>
    </div>
  );
}