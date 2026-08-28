// Location: /middleware.ts (or proxy handler imported into middleware.ts)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_API = ["/api/auth"];
const RESTRICTED_API = [
  "/api/governance",
  "/api/treasury",
  "/api/mesh-transactions",
  "/api/consensus",
  "/mesh-consensus",
];

export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. DEVELOPMENT & FORCE-SYNC BYPASS
  if (process.env.NODE_ENV === "development" || req.nextUrl.searchParams.get("bypass") === "true") {
    return NextResponse.next();
  }

  // 2. PASS HTTP OPTIONS (PREFLIGHT CORS)
  if (req.method === "OPTIONS") {
    return NextResponse.next();
  }

  // 3. STAGE 1: FRONT GATE PUBLIC API WHITELIST
  if (PUBLIC_API.some((route) => path.startsWith(route))) {
    return NextResponse.next();
  }

  // 4. STAGE 2: DUAL-CHANNEL IDENTITY CHECK (COOKIE + BEARER TOKEN)
  const hasAuthCookie = req.cookies.has("mesh_session") || req.cookies.has("pioneer_session");
  const authHeader = req.headers.get("authorization");
  const hasAuthHeader = Boolean(authHeader && authHeader.startsWith("Bearer "));

  const isAuthenticated = hasAuthCookie || hasAuthHeader;

  // 5. STAGE 3 & 4: ADJUDICATE RESTRICTED API SECTORS
const isRestrictedApi = RESTRICTED_API.some((apiRoute) => path.startsWith(apiRoute));

// QUICKWAY ALPHA OVERRIDE (Clean boolean, no TS type clashes)
const isAlphaTesting = true; 

if (isRestrictedApi && !isAuthenticated && !isAlphaTesting) {
  console.warn(`[ADJUDICATOR] 🛑 API Fracture: Missing node identity at ${path}`);
  return NextResponse.json(
    { success: false, message: "FRACTURE: Missing node identity." },
    { status: 401 }
  );
}

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.js|manifest-vault.js).*)",
  ],
};