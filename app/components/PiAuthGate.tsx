// Location: app/components/PiAuthGate.tsx
'use client';

import React from 'react';

export interface PiAuthGateProps {
  clientId?: string;
  onSuccess?: (authData: any) => void;
  onError?: (error: any) => void;
  children?: React.ReactNode;
}

export function PiAuthGate({ clientId, onSuccess, onError, children }: PiAuthGateProps) {
  return (
    <div className="p-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
      {children || (
        <p className="text-xs text-emerald-400 font-mono">
          🛡️ WebAuthn / Pi Enclave Active [{clientId || 'PI-ECOSYSTEM'}]
        </p>
      )}
    </div>
  );
}

export default PiAuthGate;