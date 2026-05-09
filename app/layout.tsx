import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 🛡️ MESH IMPORTS
import Script from "next/script";
import MainNavigation from "./components/MainNavigation";
import { AuthProvider } from "@/context/AuthContext"; // 🛡️ NEW IMPORT

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bazaar Republic Alpha",
  description: "MESH Protocol v23 Readiness Node",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* 🛡️ SALTED SDK REFRESH: Bypasses S23 Cache-Lock */}
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js?v=FORCE_SYNC" 
          strategy="beforeInteractive"
        />
        {/* 🛡️ GLOBAL INITIALIZATION: Primes the bridge before the UI renders */}
        <Script id="pi-init-logic" strategy="afterInteractive">
          {`
            (function() {
              const initPi = () => {
                if (window.Pi) {
                  window.Pi.init({ version: "2.0", sandbox: true });
                  console.log("[MESH-SCAN] Global Bridge: PRIMED");
                } else {
                  setTimeout(initPi, 100);
                }
              };
              initPi();
            })();
          `}
        </Script>
      </head>
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen flex flex-col`}>
        {/* 🛡️ AUTH PROVIDER: Wrapping all UI sectors to ensure global state sync */}
        <AuthProvider>
          <MainNavigation />
          
          <main className="grow">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}