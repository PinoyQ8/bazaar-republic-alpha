import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 🛡️ THE SECURITY ADJUDICATOR: ZERO-TRUST PERIMETER
 * ---------------------------------------------------------
 * Intercepts network traffic at the edge. 
 */

const RESTRICTED_SECTORS = ["/academy", "/enetwork", "/governance", "/treasury"];
const RESTRICTED_API = ["/api/academy", "/api/governance", "/api/treasury", "/api/mesh-transactions"];

// 🛡️ CRITICAL FIX: Next.js strictly requires the function to be named 'middleware'
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. 🛑 BYPASS: Static Assets, Public Routes, & Sector 1 Alpha-Track
  // 1. 🛑 BYPASS: Static Assets, Public Routes, & Alpha-Track Sectors
  if (
    path === "/" || 
    path === "/academy/vault" || 
    path.startsWith("/api/auth") ||
    path.startsWith("/governance/security-circle") || 
    path.startsWith("/governance/command-center") // 🛡️ NEW MESH-BYPASS: Active
  ) {
    return NextResponse.next();
  }

  // 2. 🔐 EXTRACT HANDSHAKE
  const hasMeshToken = req.cookies.has("MESH_AUTH_TOKEN") || req.cookies.has("next-auth.session-token");

  // 3. 🛡️ ADJUDICATE UI SECTORS
  const isRestrictedSector = RESTRICTED_SECTORS.some((sector) => path.startsWith(sector));
  if (isRestrictedSector && !hasMeshToken) {
    console.warn(`[ADJUDICATOR] ⚠️ Unauthorized node intercepted at ${path}. Bouncing to Hero Sector.`);
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 4. 🛡️ ADJUDICATE API SECTORS
  const isRestrictedApi = RESTRICTED_API.some((apiRoute) => path.startsWith(apiRoute));
  if (isRestrictedApi && !hasMeshToken) {
    console.error(`[ADJUDICATOR] 🚨 Rogue API request blocked at ${path}.`);
    return NextResponse.json(
      { success: false, message: "ADJUDICATOR: ZERO-TRUST PERIMETER ACTIVE. ACCESS DENIED." },
      { status: 401 }
    );
  }

  // 5. ✅ PASS-THROUGH
  return NextResponse.next();
}

/**
 * ⚙️ THE MESH MATCHER PROTOCOL
 * Prevents the edge router from wasting CPU cycles on static files.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.js|manifest-vault.js).*)",
  ],
};