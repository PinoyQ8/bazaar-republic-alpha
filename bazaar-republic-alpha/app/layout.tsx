// app/layout.tsx
import "./globals.css"; // 🛡️ CRITICAL: This activates the Tailwind matrix

import Script from "next/script";
import { MeshInitializer } from "./components/MeshInitializer"; 
import PioneerNav from "./components/Navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-neutral-950 text-amber-500 font-mono antialiased scroll-smooth" data-scroll-behavior="smooth">
// ... rest of the architecture remains unchanged
      
      <body className="bg-neutral-950 min-h-screen flex flex-col md:flex-row overflow-x-hidden overflow-y-auto">
        
        {/* 🛡️ PATCH 2: Pi SDK script injected directly inside body/html. Next.js handles the head injection automatically. */}
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js" 
          strategy="beforeInteractive" 
        />
        
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