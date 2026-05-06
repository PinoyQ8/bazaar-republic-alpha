import type { Metadata } from "next";
import { Inter } from "next/font/google";
// ADJUDICATOR FIX: Removed Next.js 'Script' import. We bypass optimization here.
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
      <head>
        {/* THE GLOBAL HANDSHAKE: Raw HTML injection forces Pi SDK to mount first */}
        <script src="https://sdk.minepi.com/pi-sdk.js" async={false}></script>
      </head>
      <body className={`${inter.className} bg-black text-white overflow-x-hidden min-h-screen`}>
        {children}
      </body>
    </html>
  );
}