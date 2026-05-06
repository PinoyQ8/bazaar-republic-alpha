import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bazaar Republic - Alpha",
  description: "Type-2 Defense Node for the E-Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white overflow-x-hidden min-h-screen`}>
        {/* ADJUDICATOR FIX: Changed to afterInteractive to prevent mobile black screen */}
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js" 
          strategy="afterInteractive" 
        />
        {children}
      </body>
    </html>
  );
}