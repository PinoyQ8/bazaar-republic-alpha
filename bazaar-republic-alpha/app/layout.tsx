import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// 🛡️ THE MESH COMPONENTS
import { AlphaGuardrail } from '@/components/AlphaGuardrail';
import { AuthProvider } from "@/context/AuthContext";
import CommandNav from "@/app/components/CommandNav";

const inter = Inter({ subsets: ["latin"] });

// 🛡️ LAYER 1: MESH METADATA STUMP
export const metadata: Metadata = {
  title: "Bazaar Republic | E-Network",
  description: "A Decentralized Autonomous Organization (DAO) powered by the Pi Network. MESH Protocol Active.",
  applicationName: "Bazaar Republic Alpha",
  authors: [{ name: "Bazaar Founder & Co-Pioneer" }],
  creator: "Project Bazaar DAO",
  publisher: "The MESH Protocol",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Bazaar Republic | DAO Mainnet",
    description: "Zero-Trust Pioneer Node Architecture.",
    siteName: "Bazaar Republic",
  },
  other: {
    "copyright": "© 2026 Project Bazaar DAO. All rights hard-coded.",
    "mesh-version": "v23 Mainnet Readiness",
    "x570-node": "Active"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* 🛡️ TERMINAL AESTHETIC & THUMB-ZONE PADDING (S23 Viewport Lock) */}
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 pb-20 md:pb-0 flex flex-col min-h-screen`}>
        
        {/* 🛡️ ALPHA STATUS GUARDRAIL */}
        <AlphaGuardrail />

        {/* 🛡️ THE PI NETWORK SDK INJECTION */}
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js" 
          strategy="afterInteractive" 
        />

        {/* 🛡️ THE AUTHENTICATION SHIELD */}
        <AuthProvider>
          
          {/* Main content pushed to fill vertical space */}
          <main className="flex-grow">{children}</main>
          
          {/* 🛡️ LAYER 2: THE VISUAL STAMP */}
          <footer className="w-full py-6 border-t border-zinc-800 bg-black text-center font-mono z-40">
            <p className="text-zinc-600 text-[10px] sm:text-xs uppercase tracking-widest">
              © 2026 Project Bazaar DAO. All Rights Reserved.
            </p>
            <p className="text-emerald-900/50 text-[8px] sm:text-[10px] mt-1 tracking-widest">
              MESH PROTOCOL SECURED | E-NETWORK V23
            </p>
          </footer>

          {/* 🛡️ THE GLOBAL COMMAND BAR (S23 MOBILE NODE) */}
          <CommandNav />
          
        </AuthProvider>
      </body>
    </html>
  );
}