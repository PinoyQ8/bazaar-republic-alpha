import type { Metadata, Viewport } from "next";
import Script from "next/script"; // 🛡️ CRITICAL INJECTION: Next.js Script Optimizer
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { MeshInitializer } from "./components/MeshInitializer";
import MeshMobileNav from "./components/MeshMobileNav";

// 🛡️ NEO PROTOCOL: Ledger Metadata
export const metadata: Metadata = {
  title: "Project Bazaar DAO",
  description: "MESH Protocol Node - E-Network Ecosystem",
};

// 🛡️ S23 VIEWPORT MATRIX: Mobile Lock for Pi Browser
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a", // Matches neutral-950
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="w-full min-h-dvh bg-neutral-950 text-neutral-100 flex flex-col items-center justify-start overflow-x-hidden select-none antialiased">
        
        {/* 🛡️ THE BRIDGE: Global Pi SDK Injection */}
        {/* Note: Next.js auto-injects 'beforeInteractive' into <head> */}
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js" 
          strategy="beforeInteractive" 
        />

        <AuthProvider>
          <MeshInitializer>
            
            {/* 🛡️ S23 VIEWPORT SHELL (384x854) */}
            <div className="w-full max-w-[384px] min-h-dvh border-x border-neutral-900 bg-neutral-950/80 backdrop-blur-md flex flex-col relative shadow-2xl shadow-cyan-900/10">
              
              {/* 🛡️ CORE PAYLOAD */}
              <main className="flex-1 w-full px-4 pt-4 pb-24 transition-all duration-200">
                {children}
              </main>

              {/* 🛡️ COMMAND NAVIGATION */}
              <MeshMobileNav />
              
            </div>

          </MeshInitializer>
        </AuthProvider>
      </body>
    </html>
  );
}