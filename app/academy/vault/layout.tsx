import { Metadata } from 'next';
import React from 'react';

// 🛡️ MESH METADATA OVERRIDE
export const metadata: Metadata = {
  title: 'Cryptographic Vault // Project Bazaar',
  description: 'Isolated Pi Network Authentication Matrix',
};

export default function VaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="vault-perimeter-node w-full h-full relative">
      {/* Background Grid Isolation (Syntax Optimized) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] 'bg-[24px_24px]' pointer-events-none -z-10"></div>
      
      {/* Core Children Render */}
      {children}
    </section>
  );
}