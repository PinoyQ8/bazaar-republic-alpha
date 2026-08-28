import './globals.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { AuthProvider } from '@/context/AuthContext';
import { TestnetNoticeBanner } from '@/components/TestnetNoticeBanner';
import MeshMobileNav from '@/components/MeshMobileNav';

export const metadata: Metadata = {
  title: 'Project Bazaar DAO | MESH Protocol',
  description: 'Decentralized Autonomous Marketplace & Pioneer Verification Grid',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className="bg-neutral-950 text-slate-100 font-sans antialiased min-h-dvh flex flex-col items-center justify-start overflow-x-hidden">
        {/* Load Pi SDK without blocking client-side page rendering */}
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="afterInteractive"
        />
        
        <AuthProvider>
          <div className="w-full max-w-[384px] min-h-dvh flex flex-col relative border-x border-neutral-900 shadow-2xl bg-neutral-950">
            <TestnetNoticeBanner />
            <main className="flex-1 px-3 pt-3 pb-24 transition-all duration-200">
              {children}
            </main>
            <MeshMobileNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
