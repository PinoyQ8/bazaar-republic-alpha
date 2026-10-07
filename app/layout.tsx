import './globals.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { AuthProvider } from '@/context/AuthContext';
import { TestnetNoticeBanner } from '@/components/TestnetNoticeBanner';
import MeshMobileNav from '@/components/MeshMobileNav';
import ClientHydrationGuard from '@/components/ClientHydrationGuard';

export const metadata: Metadata = {
  title: 'Project Bazaar DAO | MESH Protocol',
  description: 'Decentralized Autonomous Marketplace & Pioneer Verification Grid',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#020617', // slate-950
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className="bg-slate-950 text-slate-100 font-sans antialiased min-h-dvh flex flex-col items-center justify-start overflow-x-hidden">
        {/* Pi SDK root injection with beforeInteractive priority */}
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="beforeInteractive"
        />

        <AuthProvider>
          <ClientHydrationGuard>
            <div className="w-full max-w-[384px] min-h-dvh flex flex-col relative border-x border-slate-900 shadow-2xl bg-slate-950">
              <TestnetNoticeBanner />
              <main className="flex-1 px-3 pt-3 pb-24 transition-all duration-200">
                {children}
              </main>
              <MeshMobileNav />
            </div>
          </ClientHydrationGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
