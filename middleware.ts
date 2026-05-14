// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. 🛡️ SNIFF THE VAULT: Check for the session cookie
  const session = request.cookies.get('mesh_session_token')?.value;

  // 2. 🛡️ DEFINE RESTRICTED SECTORS
  const isAcademyRoute = request.nextUrl.pathname.startsWith('/academy');
  const isDaoRoute = request.nextUrl.pathname.startsWith('/dao');

  // 3. 🛡️ ENFORCE THE BOUNDARY
  if ((isAcademyRoute || isDaoRoute) && !session) {
    // No cookie? Redirect the intruder back to the Hero Sector
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// 🛡️ MATCHING PROTOCOL: Only run on specific paths to save X570 resources
export const config = {
  matcher: ['/academy/:path*', '/dao/:path*'],
};