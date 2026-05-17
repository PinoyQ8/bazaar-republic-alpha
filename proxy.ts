// 🛡️ BAZAAR REPUBLIC: UNIFIED NEXT.JS 16 GLOBAL PROXY FIREWALL
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyMeshToken } from './lib/auth-mesh';

// Explicit PCT Whitelist Route Array (Bypass API checks for login/initialization)
const PCT_WHITELIST = [
  '/api/auth/verify', 
  '/api/sandbox-status',
  '/favicon.ico'
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ====================================================================
  // 🏛️ SECTOR 1: FRONTEND VIEWPORT PAGE PROTECTION (OLD MIDDLEWARE MERGE)
  // ====================================================================
  const isPagePath = ['/academy', '/dao', '/dashboard'].some(route => pathname.startsWith(route));
  
  if (isPagePath) {
    // 🔍 SNIFF THE VAULT: Check for the active session cookie
    const session = request.cookies.get('mesh_session_token')?.value;

    if (!session) {
      // No Vault Key? Redirect the rogue node back to the Genesis Sector
      console.warn(`[MESH-SCAN] Perimeter breach blocked on page path: ${pathname}. Rerouting to gateway.`);
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    return NextResponse.next();
  }

  // ====================================================================
  // 🛡️ SECTOR 2: AUTOMATED API ACCUMULATION LAYER FIREWALL
  // ====================================================================
  if (pathname.startsWith('/api')) {
    // Rule 1: Allow complete pass-through for public and initialization API routes
    if (PCT_WHITELIST.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Rule 2: Intercept all other dynamic endpoint operations under /api/*
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "PCT Security Protocol Exception: Missing cryptographic signature header." },
        { status: 401 }
      );
    }

    // Extract the raw token from the Bearer configuration layout
    const meshToken = authHeader.split(' ')[1];
    
    // Rule 3: Cryptographically verify signature and expiration window via Web Crypto
    const verifiedSession = await verifyMeshToken(meshToken);

    if (!verifiedSession) {
      return NextResponse.json(
        { error: "PCT Security Protocol Exception: Cryptographic handshake expired or tampered." },
        { status: 401 }
      );
    }

    // Enforce Passage: Inject the verified user data into downstream request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-mesh-pioneer-uid', verifiedSession.pioneerUid);
    requestHeaders.set('x-mesh-pioneer-role', verifiedSession.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

// 🛡️ COMBINED MATCHING PROTOCOL: Hyper-optimized to encompass all protected zones
export const config = {
  matcher: [
    '/api/:path*',
    '/academy/:path*', 
    '/dao/:path*', 
    '/dashboard/:path*'
  ],
};