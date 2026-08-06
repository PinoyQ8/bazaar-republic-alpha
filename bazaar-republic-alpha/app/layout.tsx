// Location: app/layout.tsx
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { MeshInitializer } from "./components/MeshInitializer";
import MeshMobileNav from "./components/MeshMobileNav";

export const metadata: Metadata = {
  title: "Project Bazaar DAO",
  description: "MESH Protocol Node - E-Network Ecosystem",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

// 🛡️ MUST BE A SYNCHRONOUS FUNCTION COMPONENT
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className="w-full min-h-dvh bg-neutral-950 text-neutral-100 flex flex-col items-center justify-start overflow-x-hidden select-none antialiased">
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js" 
          strategy="beforeInteractive" 
        />

        <AuthProvider>
          <MeshInitializer>
            <div className="w-full max-w-[384px] min-h-dvh border-x border-neutral-900 bg-neutral-950/80 backdrop-blur-md flex flex-col relative shadow-2xl shadow-cyan-900/10">
              <main className="flex-1 w-full px-4 pt-4 pb-24 transition-all duration-200 select-auto">
                {children}
              </main>
              <MeshMobileNav />
            </div>
          </MeshInitializer>
        </AuthProvider>
      </body>
    </html>
  );
}