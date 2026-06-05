import type { Metadata } from 'next';
import Script from 'next/script';
import { MeshInitializer } from '@/app/components/MeshInitializer'; // 🛡️ Import the Wrapper
import PioneerNav from '@/app/components/Navigation';
import './globals.css'; 

export const metadata: Metadata = {
  title: 'BaZaAr rEpubLiC',
  description: 'Project Bazaar E-Network Command Node - Neo Protocol Active',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-neutral-950">
      <head>
        {/* 🔌 THE BRIDGE: PI NETWORK SDK INJECTION */}
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js" 
          strategy="beforeInteractive" 
        />
      </head>
      
      {/* Added flex and flex-col to manage the vertical stacking of Nav and Content */}
      <body className="bg-neutral-950 text-amber-500 font-mono antialiased overflow-x-hidden min-h-screen flex flex-col">
        {/* 🛡️ MESH INITIALIZATION GATE */}
        <MeshInitializer>
          
          {/* 🗺️ GLOBAL NAVIGATION ANCHOR */}
          <PioneerNav />
          
          {/* ⚡ DYNAMIC SECTOR RENDERING */}
          <main className="grow">
            {children}
          </main>

        </MeshInitializer>
      </body>
    </html>
  );
}