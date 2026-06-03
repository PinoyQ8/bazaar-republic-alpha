import type { Metadata } from 'next';
import Script from 'next/script';
import { MeshInitializer } from '@/app/components/MeshInitializer'; // 🛡️ Import the Wrapper
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
      
      <body className="bg-neutral-950 text-amber-500 font-mono antialiased overflow-x-hidden min-h-screen">
        {/* 🛡️ MESH INITIALIZATION GATE */}
        <MeshInitializer>
          {children}
        </MeshInitializer>
      </body>
    </html>
  );
}