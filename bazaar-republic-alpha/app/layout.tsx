import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// 🛡️ THE MESH COMPONENTS
import { AlphaGuardrail } from '@/components/AlphaGuardrail';
import { AuthProvider } from "@/context/AuthContext";
import CommandNav from "@/app/components/CommandNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bazaar Republic",
  description: "DAO Governance & E-Network Hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* 🛡️ TERMINAL AESTHETIC & THUMB-ZONE PADDING */}
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 pb-20 md:pb-0`}>
        
        {/* 🛡️ ALPHA STATUS GUARDRAIL */}
        <AlphaGuardrail />

        {/* 🛡️ THE PI NETWORK SDK INJECTION */}
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js" 
          strategy="afterInteractive" 
        />

        {/* 🛡️ THE AUTHENTICATION SHIELD */}
        <AuthProvider>
          <main>{children}</main>
          
          {/* 🛡️ THE GLOBAL COMMAND BAR (S23 MOBILE NODE) */}
          <CommandNav />
        </AuthProvider>
      </body>
    </html>
  );
}