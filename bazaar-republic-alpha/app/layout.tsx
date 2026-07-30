import type { Metadata } from "next";
import Script from "next/script"; // 🛡️ INJECT: Next.js Script Component
import { AuthProvider } from "@/context/AuthContext";
import { MeshInitializer } from "@/app/components/MeshInitializer";
import MeshMobileNav from "@/app/components/MeshMobileNav"; 
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Bazaar DAO | MESH Protocol",
  description: "Decentralized E-Network Core",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {/* 🛡️ PI SDK INJECTION: Must load before interactive logic */}
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js" 
          strategy="beforeInteractive" 
        />
      </head>
      {/* 🛡️ Viewport Clamp Active */}
      <body className="bg-black text-zinc-100 font-mono antialiased pb-24 overflow-x-hidden w-full max-w-full">
        
        <AuthProvider>
          <MeshInitializer>
            
            {children}

            <MeshMobileNav />

          </MeshInitializer>
        </AuthProvider>
        
      </body>
    </html>
  );
}