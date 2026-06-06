import type { Metadata } from 'next';
import Script from 'next/script';
import { MeshInitializer } from '@/app/components/MeshInitializer';
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
    <html lang="en" className="bg-neutral-950 text-amber-500 font-mono antialiased scroll-smooth">
      <head>
        <Script 
  src="https://sdk.minepi.com/pi-sdk.js" 
  strategy="beforeInteractive" 
/>
      </head>
      
      <body className="bg-neutral-950 min-h-screen flex flex-col md:flex-row overflow-hidden">
        <MeshInitializer>
          
          {/* SIDEBAR NAVIGATION */}
          <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-800 shrink-0 bg-neutral-950 z-20">
             <PioneerNav />
          </aside>
          
          {/* MAIN VIEWPORT */}
          <main className="flex-1 overflow-y-auto bg-neutral-950 h-screen">
            <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
              {children}
            </div>
          </main>

        </MeshInitializer>
      </body>
    </html>
  );
}