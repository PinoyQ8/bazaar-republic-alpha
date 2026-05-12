// Route: /middleware.ts
// Logic: E-Network Route Integrity Shield

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Extract the encrypted state lock
  const sessionToken = request.cookies.get('mesh_session_token')?.value;

  // Define the isolated E-Network routes that require a 100% Uptime Shield
  const isProtectedPath = 
    request.nextUrl.pathname.startsWith('/dashboard') || 
    request.nextUrl.pathname.startsWith('/mesh-scan') ||
    request.nextUrl.pathname.startsWith('/alpha-track');

  // Adjudicator Logic: If trying to access a secure route without a token, flush to entry gate
  if (isProtectedPath && !sessionToken) {
    console.log(`MESH Adjudicator: Unauthorized access attempt at ${request.nextUrl.pathname}. Routing to /.`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow safe passage
  return NextResponse.next();
}

// Strictly target only the routes we need to audit, saving RAM overhead
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/mesh-scan/:path*',
    '/alpha-track/:path*'
  ],
};