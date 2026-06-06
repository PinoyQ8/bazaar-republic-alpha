import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 🛡️ THE SECURITY ADJUDICATOR: ZERO-TRUST PERIMETER
 * Next.js 16 Proxy Architecture
 */

const RESTRICTED_SECTORS = ["/academy", "/enetwork", "/governance", "/treasury"];
const RESTRICTED_API = ["/api/academy", "/api/governance", "/api/treasury", "/api/mesh-transactions"];

export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. 🛑 BYPASS & ALPHA TRACK EXEMPTIONS
  if (
    path === "/" || 
    path === "/governance" ||          // AUTHORIZED: Governance Node
    path === "/log-in" ||             // AUTHORIZED: Login Sector
    path === "/alpha-track" ||        // AUTHORIZED: Alpha Terminal
    path === "/academy" ||            // AUTHORIZED: Academy
    path === "/academy/vault" || 
    path.startsWith("/api/auth") ||
    path.startsWith("/governance/security-circle") || 
    path.startsWith("/governance/command-center")
  ) {
    return NextResponse.next();
  }

  // 2. 🔐 EXTRACT HANDSHAKE
  const isAuthenticated = req.cookies.has("pioneer_uid");

  // 3. 🛡️ ADJUDICATE UI SECTORS
  const isRestrictedSector = RESTRICTED_SECTORS.some((sector) => path.startsWith(sector));
  if (isRestrictedSector && !isAuthenticated) {
    console.warn(`[ADJUDICATOR] ⚠️ Unauthorized node intercepted at ${path}. Bouncing to Hero Sector.`);
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 4. 🛡️ ADJUDICATE API SECTORS
  const isRestrictedApi = RESTRICTED_API.some((apiRoute) => path.startsWith(apiRoute));
  if (isRestrictedApi && !isAuthenticated) {
    return NextResponse.json(
      { success: false, message: "ADJUDICATOR: ZERO-TRUST PERIMETER ACTIVE." },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

/**
 * ⚙️ THE MESH MATCHER PROTOCOL
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.js|manifest-vault.js).*)",
  ],
};