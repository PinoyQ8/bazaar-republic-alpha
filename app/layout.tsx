import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 🛡️ MESH IMPORTS
import Script from "next/script";
import MainNavigation from "./components/MainNavigation";
import { AuthProvider } from "@/context/AuthContext";

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
        {/* 🛡️ SALTED SDK REFRESH: Bypasses S23 Cache-Lock and primes P23 logic */}
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js?v=FORCE_SYNC" 
          strategy="beforeInteractive"
        />
        
        {/* 🛡️ GLOBAL INITIALIZATION: Hard-coded security handshake */}
        <Script id="pi-init-logic" strategy="afterInteractive">
          {`
            (function() {
              const initPi = () => {
                if (window.Pi) {
                  try {
                    window.Pi.init({ version: "2.0", sandbox: true });
                    console.log("[MESH-SCAN] Global Bridge: PRIMED (v2.0 Sandbox)");
                  } catch (err) {
                    console.error("[MESH-SCAN] Bridge Initialization Fracture:", err);
                  }
                } else {
                  // Retry logic for low-bandwidth mobile sectors
                  setTimeout(initPi, 150);
                }
              };

              // Ensure the DOM is ready for the Iframe Handshake
              if (document.readyState === 'complete') {
                initPi();
              } else {
                window.addEventListener('load', initPi);
              }
            })();
          `}
        </Script>
      </head>
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen flex flex-col antialiased`}>
        {/* 🛡️ AUTH PROVIDER: The Global State Vault */}
        <AuthProvider>
          <MainNavigation />
          
          <main className="grow flex flex-col">
            {children}
          </main>
          
          {/* 🛡️ OPTIONAL: Sector Footer can be added here */}
        </AuthProvider>
      </body>
    </html>
  );
}