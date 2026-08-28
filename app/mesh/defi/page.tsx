'use client';

import React from 'react';
import MeshDefiDashboard from '@/components/MeshDefiDashboard';
import PioneerAuthGate from '@/app/components/PioneerAuthGate';

export default function MeshDefiPage() {
  return (
    <PioneerAuthGate>
      <main className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
        <MeshDefiDashboard />
      </main>
    </PioneerAuthGate>
  );
}
