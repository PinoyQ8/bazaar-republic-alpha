import type { Metadata } from "next";
import "./globals.css";
// 🛡️ STRICT RELATIVE IMPORTS
import { AuthProvider } from "./context/AuthContext";
import { MeshInitializer } from "./components/MeshInitializer";
// 🛡️ THE NEW S23 MOBILE MATRIX
import MeshMobileNav from "./components/MeshMobileNav"; 

export const metadata: Metadata = {
  title: "Project Bazaar DAO",
  description: "MESH Protocol Node - S23 Viewport Matrix",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="w-full min-h-dvh bg-neutral-950 text-neutral-100 flex flex-col items-center justify-start overflow-x-hidden select-none antialiased">
        <AuthProvider>
          <MeshInitializer>
            
            {/* 🛡️ S23 VIEWPORT SHELL */}
            <div className="w-full max-w-[384px] min-h-dvh border-x border-neutral-900 bg-neutral-950/80 backdrop-blur-md flex flex-col relative">
              
              {/* 🛡️ CORE PAYLOAD (pb-24 ensures content doesn't hide under the nav) */}
              <main className="flex-1 w-full px-4 pt-4 pb-24 transition-all duration-200">
                {children}
              </main>

              {/* 🛡️ S23 COMMAND NAVIGATION */}
              <MeshMobileNav />
              
            </div>

          </MeshInitializer>
        </AuthProvider>
      </body>
    </html>
  );
}