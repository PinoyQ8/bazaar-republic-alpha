import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 🛡️ CRITICAL: Import the Provider
import { AuthProvider } from "@/context/AuthContext"; 

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
      <body className={inter.className}>
        {/* The Provider is now defined and wrapped */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}