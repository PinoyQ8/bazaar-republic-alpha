import type { Metadata } from "next";
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
      {/* 🛡️ PATCH: Added overflow-x-hidden w-full max-w-full to clamp horizontal scrolling */}
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