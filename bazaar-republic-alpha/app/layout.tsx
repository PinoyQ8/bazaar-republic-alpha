import type { Metadata } from "next";
import "./globals.css";
// 🛡️ STRICT RELATIVE IMPORTS: Bypasses tsconfig alias fractures
import { AuthProvider } from "./context/AuthContext";
import { MeshInitializer } from "./components/MeshInitializer";

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
            <main className="w-full max-w-[384px] min-h-dvh px-4 pt-4 pb-24 border-x border-neutral-900 bg-neutral-950/80 backdrop-blur-md flex flex-col justify-between transition-all duration-200">
              {children}
            </main>
          </MeshInitializer>
        </AuthProvider>
      </body>
    </html>
  );
}