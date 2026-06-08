// app/layout.tsx
import "./globals.css"; // 🛡️ Activates the Tailwind matrix

import Script from "next/script";
import { MeshInitializer } from "./components/MeshInitializer"; 
import PioneerNav from "./components/Navigation";

// 🛡️ E-Network Registry Metadata
export const metadata = {
  title: "Project Bazaar | MESH-Academy",
  description: "Decentralized Security and E-Network Onboarding",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-neutral-950 text-amber-500 font-mono antialiased scroll-smooth" data-scroll-behavior="smooth">
      
      {/* 🛡️ Root Injection Layer */}
      <head>
        {/* Pi SDK Bridge: Locked in <head> for absolute beforeInteractive priority */}
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js" 
          strategy="beforeInteractive" 
        />
      </head>

      <body className="bg-neutral-950 min-h-screen flex flex-col md:flex-row overflow-x-hidden overflow-y-auto">
        
        {/* 🛡️ Hydration Buffer & State Manager */}
        <MeshInitializer>
          
          {/* SIDEBAR NAVIGATION */}
          <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-amber-900 shrink-0">
             <PioneerNav />
          </aside>
          
          {/* MAIN VIEWPORT */}
          <main className="flex-1 overflow-y-auto bg-neutral-950 min-h-screen">
            <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
              {children}
            </div>
          </main>

        </MeshInitializer>
        
      </body>
    </html>
  );
}