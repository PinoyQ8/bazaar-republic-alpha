"use client";

import { ProviderNodeItem } from "@/app/components/ProviderNodeItem";

// 1. Structural Purity: Re-calibrated TypeScript Interface
// This perfectly maps to the props required by ProviderNodeItem.tsx
export type ProviderNode = {
  id: string;
  pioneer: string;     // Fulfills missing 'pioneer' property
  service: string;     // Fulfills missing 'service' property
  rate: string;        // Fulfills missing 'rate' property (e.g., "50 mBZR")
  status: string;      // Fulfills missing 'status' property (e.g., "VERIFIED", "FROZEN")
  trustScore?: number; // Kept as optional (?) so TS doesn't break if omitted by the backend
};

export function ProviderList({ providers }: { providers: ProviderNode[] }) {
  
  if (!providers || providers.length === 0) {
    return (
      <p className="text-[10px] text-neutral-500 uppercase tracking-widest text-center py-20 font-mono border border-neutral-800/50 rounded bg-neutral-900/20 mx-4">
        [ NULL ] NO ACTIVE NODES IN MESH
      </p>
    );
  }

  return (
    <div className="space-y-3 px-4">
      {providers.map((node) => (
        <ProviderNodeItem key={node.id} node={node} />
      ))}
    </div>
  );
}