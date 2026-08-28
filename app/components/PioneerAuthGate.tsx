'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, UserCheck } from 'lucide-react';

interface PioneerAuthGateProps {
  children: React.ReactNode;
}

export default function PioneerAuthGate({ children }: PioneerAuthGateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Force instant DOM mount for S23 Ultra / Localhost testing
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 font-mono text-xs text-neutral-400">
        <RefreshCw size={24} className="animate-spin text-amber-500 mb-2" />
        <span>INITIALIZING ADJUDICATION CONSOLE...</span>
      </div>
    );
  }

  return <>{children}</>;
}
