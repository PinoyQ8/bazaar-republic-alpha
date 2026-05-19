// 🛡️ BAZAAR REPUBLIC: UNIFIED NEXT.JS 16 GLOBAL PROXY FIREWALL
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyMeshToken } from './lib/auth-mesh';
import { queryStasisLedger } from './lib/stasis-ledger'; // 🔗 INJECTED: Web3 Ledger Bridge

// Explicit PCT Whitelist Route Array (Bypass API checks for login/initialization)
const PCT_WHITELIST = [
  '/api/auth/verify', 
  '/api/sandbox-status',
  '/api/academy/vault', // 🛡️ INJECTED: Whitelist the Vault Auth API Gateway
  '/favicon.ico'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ====================================================================
  // 🏛️ SECTOR 1: FRONTEND VIEWPORT PAGE PROTECTION (UPDATED WITH VAULT BYPASS)
  // ====================================================================
  const isPagePath = ['/academy', '/dao', '/dashboard'].some(route => pathname.startsWith(route));
  
  // 🛡️ THE EXPLICIT BYPASS: Drop shields strictly for the Pi SDK handshake path
  const isVaultSector = pathname === '/academy/vault';

  if (isPagePath && !isVaultSector) {
    // 🔍 SNIFF THE VAULT: Check for the active session cookie
    const session = request.cookies.get('mesh_session_token')?.value;

    if (!session) {
      // No Vault Key? Redirect the rogue node back to the Genesis Sector
      console.warn(`[MESH-SCAN] Perimeter breach blocked on page path: ${pathname}. Rerouting to gateway.`);
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    return NextResponse.next();
  }

  // If they are explicitly heading to the vault, let them pass through to render the component
  if (isVaultSector) {
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

    // 🏛️ UPGRADED GENESIS OVERRIDE BRIDGE
    // Validates either the raw master passcode OR the cached Founder identity strings
    const isGenesisNode = 
      meshToken === process.env.GENESIS_PASSCODE || 
      meshToken?.toLowerCase() === "pinoyq8" ||
      meshToken?.toLowerCase() === "mommydors";

    if (isGenesisNode) {
      console.log(`[MESH-SCAN] Genesis Node override verified for API path: ${pathname} using token [${meshToken}]`);
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-mesh-pioneer-uid', "GENESIS-ANCHOR");
      requestHeaders.set('x-mesh-pioneer-role', "FOUNDER");
      
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    // Rule 3: Cryptographically verify signature and expiration window via Web Crypto
    const verifiedSession = await verifyMeshToken(meshToken);

    if (!verifiedSession) {
      return NextResponse.json(
        { error: "PCT Security Protocol Exception: Cryptographic handshake expired or tampered." },
        { status: 401 }
      );
    }

    // ====================================================================
    // ⛓️ SECTOR 2.5: ON-CHAIN STASIS ADJUDICATION (SOROBAN TESTNET)
    // ====================================================================
    const isNodeFrozen = await queryStasisLedger(verifiedSession.pioneerUid);
    
    if (isNodeFrozen) {
      console.warn(`[STASIS-LOCK] Node ${verifiedSession.pioneerUid} is frozen on-chain. Connection severed.`);
      return NextResponse.json(
        { error: "Stasis Protocol Active: Your node is mathematically locked on the Testnet. Access Denied." },
        { status: 403 }
      );
    }

    // ====================================================================
    // 🟢 ENFORCE PASSAGE: Inject verified data downstream
    // ====================================================================
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